
const apiDelay = () => new Promise((resolve) => setTimeout(resolve, 50)) // limit on contentstack api ('x' req/sec)

export const createEntries = async (context, contentUid, entries, createBody, createCacheEntry) => {
  const responses = {}
  for (const entry of entries) {
    const index = Object.keys(responses).length + 1
    process.stdout.write(`Creating entries: [ ${contentUid} ] ${index} \r`)
    await apiDelay()
    const res = await fetch(`${context.base_url}/content_types/${contentUid}/entries?locale=en-gb`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...context.headers
      },
      body: JSON.stringify(await createBody(entry))
    })
    const response = await res.json()
    if (response['error_code']) console.error(`[ ${contentUid}: ${entry.id} ]: `, response)
    responses[entry.id || index] = createCacheEntry(response, entry)
  }
  return responses
}


export const getEntries = async (context, contentUid) => {
  await apiDelay()
  const res = await fetch(`${context.base_url}/content_types/${contentUid}/entries`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...context.headers
    }
  })
  const response = await res.json()
  return response.entries
}

export const removeEntries = async (context, contentUid, entries) => {
  const responses = []
  for (const entry of entries) {
    process.stdout.write(`Removing entries: [ ${contentUid} ] ${responses.length} \r`)
    await apiDelay()
    const res = await fetch(`${context.base_url}/content_types/${contentUid}/entries/${entry.uid}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...context.headers
      },
    })
    const response = await res.json()
    responses.push(response)
  }
  return responses
}


export const snakeCase = (str) => {
  return str?.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    .map(x => x.toLowerCase())
    .join('_');
}


export default {
  createEntries,
  getEntries,
  removeEntries,
  snakeCase
}