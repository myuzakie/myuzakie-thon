'use client'

import { useState, type FormEvent } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { EyeIcon, EyeOffIcon, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'

const LoginForm = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const body = await response.json()

      if (!response.ok) throw new Error(body.message ?? 'Login gagal')

      const requestedNext = new URLSearchParams(window.location.search).get('next')
      const nextPath = requestedNext?.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/hackathons'

      router.replace(nextPath)
      router.refresh()
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login gagal')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup className='gap-4'>
        <Field className='gap-2'>
          <FieldLabel htmlFor='userEmail' className='leading-5'>
            Email address
          </FieldLabel>
          <Input type='email' id='userEmail' placeholder='you@example.com' value={email} onChange={event => setEmail(event.target.value)} autoComplete='username' required />
        </Field>
        <Field className='w-full gap-2'>
          <FieldLabel htmlFor='password' className='leading-5'>
            Password
          </FieldLabel>
          <InputGroup>
            <InputGroupInput id='password' type={isVisible ? 'text' : 'password'} placeholder='••••••••••••' value={password} onChange={event => setPassword(event.target.value)} autoComplete='current-password' required />
            <InputGroupAddon align='inline-end' className='pr-1.5'>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => setIsVisible(prevState => !prevState)}
                className='text-muted-foreground rounded-l-none hover:bg-transparent'
              >
                {isVisible ? <EyeOffIcon /> : <EyeIcon />}
                <span className='sr-only'>{isVisible ? 'Hide password' : 'Show password'}</span>
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </Field>
        {error && <p className='border-destructive/30 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-sm'>{error}</p>}
        <div className='flex items-center justify-end gap-y-2'>
          <Link href='/pages/auth/forgot-password' className='text-base text-nowrap hover:underline'>
            Forgot Password?
          </Link>
        </div>
        <Field>
          <Button className='w-full gap-2' type='submit' disabled={isSubmitting}>
            {isSubmitting && <Loader2 className='size-4 animate-spin' />}
            Sign in to Hackathon OS
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}

export default LoginForm
