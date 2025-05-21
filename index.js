const app = require('./src/app')
const { PORT } = require('./src/config/secrets')


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
}  )

