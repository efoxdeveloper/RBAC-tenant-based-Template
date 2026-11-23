import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import Avatar from '@mui/material/Avatar'
import AvatarGroup from '@mui/material/AvatarGroup'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

function Auth({ onAuthenticated }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()

    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to sign in')
      }

      onAuthenticated(payload.user)
      navigate('/app/dashboard')
    } catch (submitError) {
      setError(submitError.message || 'Unable to sign in')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box
      component="main"
      sx={{
        height: '100dvh',
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflowY: { xs: 'auto', md: 'hidden' },
        bgcolor: '#ffffff',
        p: { xs: 0, md: 1.25 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 'none',
          height: { xs: '100dvh', md: 'calc(100dvh - 20px)' },
          display: 'flex',
          overflow: 'hidden',
          border: 0,
          borderRadius: 0,
          boxShadow: 'none',
          bgcolor: '#ffffff',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            display: { xs: 'none', md: 'flex' },
            flex: '1 1 50%',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
            p: 1.5,
            color: '#113b38',
            bgcolor: '#eef7f8',
            background:
              'linear-gradient(145deg, #f4faf9 0%, #eef4ff 58%, #e7efff 100%)',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              width: 370,
              height: 370,
              top: -120,
              right: -110,
              borderRadius: '50%',
              bgcolor: 'rgba(255, 255, 255, 0.72)',
              boxShadow: '0 20px 60px rgba(119, 161, 255, 0.12)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              width: 190,
              height: 190,
              top: 240,
              right: -30,
              borderRadius: '50%',
              background: 'linear-gradient(145deg, #a9d6ff, #4f76e8)',
              opacity: 0.9,
              filter: 'blur(1px)',
              boxShadow: '0 16px 38px rgba(79, 118, 232, 0.28)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              width: 130,
              height: 130,
              bottom: 80,
              left: -75,
              borderRadius: '50%',
              background: 'linear-gradient(145deg, #b6d9ff, #6687ea)',
              opacity: 0.82,
            }}
          />

          <Stack
            direction="row"
            spacing={1}
            sx={{ position: 'relative', height: 30, width: 'fit-content', alignItems: 'center' }}
          >
            <Box
              sx={{
                width: 26,
                height: 26,
                flexShrink: 0,
                display: 'grid',
                placeItems: 'center',
                borderRadius: '50%',
                color: '#ffffff',
                bgcolor: '#125b50',
              }}
            >
              <SupportAgentRoundedIcon sx={{ fontSize: 16 }} />
            </Box>
            <Typography sx={{ fontSize: 14, lineHeight: '30px', fontWeight: 600, letterSpacing: '-0.02em' }}>
              Support CRM
            </Typography>
          </Stack>

          <Stack spacing={0.5} sx={{ position: 'relative', maxWidth: 440 }}>
            <Typography component="h2" sx={{ fontSize: 19, lineHeight: 1.25, fontWeight: 700, letterSpacing: '-0.03em' }}>
              Every customer conversation, in one place
            </Typography>
            <Typography sx={{ fontSize: 12, lineHeight: 1.55, fontWeight: 400, color: 'rgba(17, 59, 56, 0.72)' }}>
              Keep customer requests organized and easy to track.
              <br />
              Give your team the context to resolve every conversation.
            </Typography>
            <Box
              sx={{
                mt: 1.25,
                p: 1.25,
                border: '1px solid rgba(255, 255, 255, 0.85)',
                borderRadius: 1.5,
                bgcolor: 'rgba(255, 255, 255, 0.28)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                <AvatarGroup
                  max={3}
                  sx={{
                    '& .MuiAvatar-root': {
                      width: 28,
                      height: 28,
                      fontSize: 13,
                      border: '2px solid rgba(255, 255, 255, 0.9)',
                    },
                  }}
                >
                  <Avatar sx={{ bgcolor: '#d79b72' }}>
                    <PersonRoundedIcon fontSize="small" />
                  </Avatar>
                  <Avatar sx={{ bgcolor: '#efc47e' }}>
                    <PersonRoundedIcon fontSize="small" />
                  </Avatar>
                  <Avatar sx={{ bgcolor: '#65717c' }}>
                    <PersonRoundedIcon fontSize="small" />
                  </Avatar>
                </AvatarGroup>
                <Stack spacing={0}>
                  <Typography sx={{ fontSize: 12, lineHeight: 1.3, fontWeight: 600 }}>
                    One connected workspace
                  </Typography>
                  <Typography sx={{ fontSize: 11, lineHeight: 1.35, fontWeight: 400, color: 'rgba(17, 59, 56, 0.68)' }}>
                    Everything your team needs to support customers.
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Stack>
        </Box>

        <Box
          sx={{
            flex: '1 1 50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 0,
            p: { xs: 3, sm: 4, md: 2 },
          }}
        >
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              width: 'min(100%, 390px)',
              mx: 'auto',
              alignSelf: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.25,
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                display: 'grid',
                placeItems: 'center',
                mb: 0.25,
                borderRadius: '50%',
                color: '#165b3f',
                bgcolor: 'transparent',
              }}
            >
              <SupportAgentRoundedIcon sx={{ fontSize: 26 }} />
            </Box>

            <Typography component="h1" sx={{ fontSize: 18, lineHeight: 1.15, fontWeight: 700, letterSpacing: '-0.03em', textAlign: 'center' }}>
              Welcome to Support CRM
            </Typography>
            <Typography sx={{ fontSize: 12, lineHeight: 1.2, color: 'text.secondary', textAlign: 'center' }}>
              Sign in with your email and password
            </Typography>

            <Box sx={{ position: 'relative', width: '100%' }}>
              <Box
                component="input"
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                sx={{
                  boxSizing: 'border-box',
                  width: '100%',
                  height: 38,
                  pl: 1,
                  pr: 1,
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  outline: 'none',
                  bgcolor: '#ffffff',
                  color: '#333333',
                  opacity: 1,
                  fontFamily: 'inherit',
                  fontSize: 14,
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
                  '&::placeholder': { color: '#a0a0a0', opacity: 1 },
                  '&:focus': {
                    borderColor: '#125b50',
                    boxShadow: '0 0 0 2px rgba(18, 91, 80, 0.12)',
                  },
                }}
              />
            </Box>

            <Box sx={{ position: 'relative', width: '100%' }}>
                <Box
                  component="input"
                  id="password"
                  name="password"
                  type={passwordVisible ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  sx={{
                    boxSizing: 'border-box',
                    width: '100%',
                    height: 38,
                    pl: 1,
                    pr: 5,
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    outline: 'none',
                    bgcolor: '#ffffff',
                    color: '#333333',
                    fontFamily: 'inherit',
                    fontSize: 14,
                    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
                    '&::placeholder': { color: '#a0a0a0', opacity: 1 },
                    '&:focus': {
                      borderColor: '#125b50',
                      boxShadow: '0 0 0 2px rgba(18, 91, 80, 0.12)',
                    },
                  }}
                />
                <IconButton
                  type="button"
                  aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                  onClick={() => setPasswordVisible((visible) => !visible)}
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    right: 4,
                    transform: 'translateY(-50%)',
                    p: 0.75,
                    color: '#64748b',
                  }}
                >
                  {passwordVisible ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                </IconButton>
            </Box>

            {error && (
              <Typography role="alert" sx={{ width: '100%', color: '#c62828', fontSize: 12, lineHeight: 1.35 }}>
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isSubmitting}
              sx={{
                height: 38,
                minHeight: 38,
                borderRadius: 1,
                bgcolor: '#050807',
                fontSize: 13,
                lineHeight: 1,
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': { bgcolor: '#101918', boxShadow: 'none' },
              }}
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>

            <Typography sx={{ mt: 0.5, fontSize: 12, lineHeight: 1.25, color: 'text.secondary', textAlign: 'center' }}>
              We only ask for what helps track your support — you
              <br />
              control what&apos;s shared{' '}
              <Link href="#" underline="hover" sx={{ fontSize: 12, fontWeight: 600, color: '#1976d2' }}>
                Privacy details
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  )
}

export default Auth
