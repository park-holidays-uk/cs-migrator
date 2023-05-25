import dotenv from 'dotenv';
import prompt from 'prompt-sync';

dotenv.config()

const ask = prompt({sigint: true})

const loginForAuthToken = async (context) => {
  try {
    // let password = '';
    // if (process.env.password) {
    //   password = process.env.password;
    // } else {
    //   password = ask(`(${context.email}) Contentstack login, please enter your password:  `, { echo: '*' })
    // }
    // context.password = password

    // const res = await fetch(`${context.base_url}/user-session`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     user: {
    //       email: context.email,
    //       password
    //     }
    //   })
    // })
    // const response = await res.json()

    // context.headers.authtoken = response.user.authtoken
    context.headers.authorization = context.management_token
  } catch (error) {
    console.error('login', error)
  }
  return context
}

export default loginForAuthToken