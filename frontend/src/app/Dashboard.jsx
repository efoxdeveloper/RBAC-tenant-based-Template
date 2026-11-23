import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

function Dashboard() {
  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100dvh - 88px)', md: 'calc(100dvh - 120px)' },
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <Typography component="h1" sx={{ fontSize: 24, fontWeight: 600 }}>
        Overview
      </Typography>
    </Box>
  )
}

export default Dashboard
