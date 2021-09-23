import { AmplifyAuthenticator } from '@aws-amplify/ui-react'
import { Amplify, API, Auth, withSSRContext } from 'aws-amplify'
import Head from 'next/head'
import awsExports from '../aws-exports'
import { createPost } from '../graphql/mutations'
import { listBlogs } from '../graphql/queries'
import {
  CreateBlogInput,
  CreateBlogMutation,
  ListBlogsQuery,
  Blog,
} from '../API'
import { GRAPHQL_AUTH_MODE } from '@aws-amplify/api'
import { useRouter } from 'next/router'
import { GetServerSideProps } from 'next'
import styles from '../styles/Home.module.css'

Amplify.configure({ ...awsExports, ssr: true })

export default function Home({ todos = [] }: { todos: Blog[] }) {
  const router = useRouter()

  async function handleCreateTodo(event) {
    event.preventDefault()

    const form = new FormData(event.target)

    try {
      const createInput: CreateBlogInput = {
        name: form.get('title').toString(),
      }

      const request = (await API.graphql({
        authMode: GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS,
        query: createPost,
        variables: {
          input: createInput,
        },
      })) as { data: CreateBlogMutation; errors: any[] }

      router.push(`/todo/${request.data.createBlog.id}`)
    } catch ({ errors }) {
      console.error(...errors)
      throw new Error(errors[0].message)
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Amplify + Next.js</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Amplify + Next.js</h1>

        <p className={styles.description}>
          <code className={styles.code}>{todos.length}</code>
          Todos
        </p>

        <div className={styles.grid}>
          {todos.map((todo) => (
            <a href={`/todo/${todo.id}`} key={todo.id}>
              <h3>{todo.name}</h3>
              <p>{todo.name}</p>
            </a>
          ))}

          <div className={styles.card}>
            <h3 className={styles.title}>New Todo</h3>

            <AmplifyAuthenticator>
              <form onSubmit={handleCreateTodo}>
                <fieldset>
                  <legend>Title</legend>
                  <input
                    defaultValue={`Today, ${new Date().toLocaleTimeString()}`}
                    name="title"
                  />
                </fieldset>

                <fieldset>
                  <legend>Content</legend>
                  <textarea
                    defaultValue="I built an Amplify app with Next.js!"
                    name="content"
                  />
                </fieldset>

                <button>Create Todo</button>
                <button type="button" onClick={() => Auth.signOut()}>
                  Sign out
                </button>
              </form>
            </AmplifyAuthenticator>
          </div>
        </div>
      </main>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const SSR = withSSRContext({ req })

  const response = (await SSR.API.graphql({ query: listBlogs })) as {
    data: ListBlogsQuery
  }

  return {
    props: {
      todos: response.data.listBlogs.items,
    },
  }
}
