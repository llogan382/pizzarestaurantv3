import { Amplify, API, withSSRContext } from 'aws-amplify'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { DeleteBlogInput, GetBlogQuery, Blog, ListBlogsQuery } from '../../API'
import awsExports from '../../aws-exports'
import { deleteBlog } from '../../graphql/mutations'
import { getBlog, listBlogs } from '../../graphql/queries'
import { GetStaticProps, GetStaticPaths } from 'next'
import { GRAPHQL_AUTH_MODE } from '@aws-amplify/api'
import styles from '../../styles/Home.module.css'

Amplify.configure({ ...awsExports, ssr: true })

export default function TodoPage({ todo }: { todo: Blog }) {
  const router = useRouter()

  if (router.isFallback) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Loading&hellip;</h1>
      </div>
    )
  }

  async function handleDelete(): Promise<void> {
    try {
      const deleteInput: DeleteBlogInput = {
        id: todo.id,
      }

      await API.graphql({
        authMode: GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS,
        query: deleteBlog,
        variables: {
          input: deleteInput,
        },
      })

      router.push(`/`)
    } catch ({ errors }) {
      console.error(...errors)
      throw new Error(errors[0].message)
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>{todo.name} – Amplify + Next.js</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>{todo.name}</h1>
        <p className={styles.description}>{todo.name}</p>
      </main>

      <footer>
        <button className={styles.footer} onClick={handleDelete}>
          💥 Delete todo
        </button>
      </footer>
    </div>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const SSR = withSSRContext()

  const todosQuery = (await SSR.API.graphql({
    query: listBlogs,
    authMode: GRAPHQL_AUTH_MODE.API_KEY,
  })) as { data: ListBlogsQuery; errors: any[] }

  const paths = todosQuery.data.listBlogs.items.map((todo: Blog) => ({
    params: { id: todo.id },
  }))

  return {
    fallback: true,
    paths,
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const SSR = withSSRContext()

  const response = (await SSR.API.graphql({
    query: getBlog,
    variables: {
      id: params.id,
    },
  })) as { data: GetBlogQuery }

  return {
    props: {
      todo: response.data.getBlog,
    },
  }
}
