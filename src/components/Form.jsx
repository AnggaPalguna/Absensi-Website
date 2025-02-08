'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import InputLabel from '@mui/material/InputLabel'
import Stack from '@mui/material/Stack'
import LockIcon from '@mui/icons-material/Lock'
import { app } from '../../firebase-config'

const auth = getAuth(app)

export const Form = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const onSubmit = async (e) => {
        e.preventDefault()
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password)
            if (userCredential) {
                router.push(callbackUrl)
            }
        } catch (err) {
            setError('Invalid email or password')
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4 w-full sm:w-[400px]">
            <Stack spacing={2}>
                <InputLabel htmlFor="email">Email</InputLabel>
                <TextField
                    fullWidth
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    id="email"
                    type="email"
                    variant="outlined"
                />
                <InputLabel htmlFor="password">Password</InputLabel>
                <TextField
                    fullWidth
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    id="password"
                    type="password"
                    variant="outlined"
                />
                {error && <Alert severity="error">{error}</Alert>}
                <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={<LockIcon />}
                    type="submit"
                >
                    Login
                </Button>
            </Stack>
        </form>
    )
}
