import { useState, useEffect } from 'react'
import { getStaticValues } from '../api/staticTypes'

const cache = {}

export function useStaticValues(typeCode) {
  const [values, setValues] = useState(cache[typeCode] || [])
  const [loading, setLoading] = useState(!cache[typeCode])

  useEffect(() => {
    if (cache[typeCode]) {
      setValues(cache[typeCode])
      setLoading(false)
      return
    }
    setLoading(true)
    getStaticValues(typeCode)
      .then(data => {
        cache[typeCode] = data
        setValues(data)
      })
      .catch(() => setValues([]))
      .finally(() => setLoading(false))
  }, [typeCode])

  return { values, loading }
}
