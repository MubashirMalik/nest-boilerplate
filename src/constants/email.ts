export interface Email {
    to: string 
    subject: string 
    html: string
}

// DUMMPY EMAIL FOR TESTING
export const VerifyEmail = (email: string, otp: string): Email => {
    return {
        to: email,
        subject: 'Verify Your SafeGate AI Email',
        html: `
            <div>
                <h3>SafeGate AI Email Verification</h3>
                <p>Please use this one-time code to verify your email address:</p>
                
                <div style="font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">
                ${otp}
                </div>
            
                <p>This code will expire in 10 minutes.</p>
                
                <p>If you didn't request this verification, please ignore this email or 
                <a href="https://safegate.ai/support">contact support</a> if concerned.</p>
                
                <p><small>For your security, never share this code with anyone.</small></p>
            </div>
      `
    }
}