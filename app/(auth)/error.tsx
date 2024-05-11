'use client'
import React, { useEffect } from 'react'

const ErrorBoundary= ({error, reset}: any) => {

//   useEffect(()=> {

//   }, [])
 console.log(error)
  return (
    <div>
      Error
      <button onClick={() => reset()}>Reset</button>
    </div>
  )
}

export default Error
