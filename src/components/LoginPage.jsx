'use client'

import { useState } from 'react'
import { Form } from './Form'
import Loading from './Loading'
import { Card } from "@/components/ui/card"

const Login = () => {
    const [loading, setLoading] = useState(false)

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            {loading && <Loading />} {/* Tampilkan loading di sini */}
            <Card className="sm:shadow-xl px-8 pb-8 pt-12 sm:bg-white rounded-xl ">
                <h1 className="font-semibold text-2xl text-center text-black">Login</h1>
            <Form setLoading={setLoading} />
            </Card>
        </div>
    )
}

export default Login
