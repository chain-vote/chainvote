import express from 'express'
const router = express.Router()

router.get('/:otp', (req, res) => {
  const { otp } = req.params
  res.send(`
    <html>
      <body style="background: #0a0a0a; color: #d4af37; font-family: serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0;">
        <div style="border: 1px solid #d4af37; padding: 40px; text-align: center; background: #111; box-shadow: 0 0 50px rgba(212, 175, 55, 0.1);">
          <h1 style="letter-spacing: 0.2em; font-weight: 300;">RITUAL MANIFESTED</h1>
          <p style="color: #888; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase;">Local Failsafe Mirror</p>
          <div style="font-size: 48px; margin: 30px 0; font-weight: bold; letter-spacing: 10px; color: #ff4500;">${otp}</div>
          <p style="color: #666; font-size: 10px;">Use this code to seal your action. In a production environment, this would arrive in your inbox.</p>
        </div>
      </body>
    </html>
  `)
})

export { router as ritualLogRouter }
