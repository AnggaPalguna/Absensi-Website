'use client'

import { Form } from './Form'
import { Card } from "@/components/ui/card"

const Login = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            {/* Tampilkan loading di sini */}
            <Card className="sm:shadow-xl px-8 pb-8 pt-11 sm:bg-white rounded-xl shadow-lg border-t-4 border-t-black" >
                <h1 className="font-semibold text-2xl text-center text-black">Login</h1>
            <Form />
            </Card>
        </div>
    )
}

export default Login
