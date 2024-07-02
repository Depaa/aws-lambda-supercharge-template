
export async function main(_event) {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello World' }),
  };
}
