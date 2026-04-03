import axios, { type AxiosInstance } from 'axios'

let _baseURL = 'http://localhost:8000/api'
let _getToken: () => string | null = () => null
let _onUnauthorized: () => void = () => {}

export function configureApiClient(options: {
  baseURL: string
  getToken: () => string | null
  onUnauthorized: () => void
}) {
  _baseURL = options.baseURL
  _getToken = options.getToken
  _onUnauthorized = options.onUnauthorized
}

function createApiInstance(): AxiosInstance {
  const instance = axios.create({ baseURL: _baseURL })

  instance.interceptors.request.use((config) => {
    const token = _getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  instance.interceptors.response.use(
    (res) => res,
    (error) => {
      if (error.response?.status === 401) {
        _onUnauthorized()
      }
      return Promise.reject(error)
    }
  )

  return instance
}

export const api = new Proxy({} as AxiosInstance, {
  get(_target, prop) {
    return createApiInstance()[prop as keyof AxiosInstance]
  },
})

export default api
