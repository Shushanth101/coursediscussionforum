export const buildEmailOTPBody = (otp) => {
    return (
        `
        <!DOCTYPE html>
<html>
<head>
    <title>OTP Verification</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td style="padding: 20px;">
                <table align="center" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h1 style="color: #333333; margin-top: 0; text-align: center;">One-Time Password (OTP)</h1>
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin-top: 20px; text-align: center;">
                                Thank you for using our service. Please use the following code to verify your identity.
                            </p>
                            
                            <div style="margin: 30px 0; text-align: center;">
                                <span style="display: inline-block; padding: 15px 30px; background-color: #007bff; color: #ffffff; font-size: 28px; font-weight: bold; border-radius: 5px; letter-spacing: 4px;">
                                    ${otp}
                                </span>
                            </div>

                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin-top: 20px; text-align: center;">
                                This code will expire in <strong>10 minutes</strong> for security reasons.
                            </p>

                            <p style="color: #999999; font-size: 14px; margin-top: 40px; text-align: center;">
                                If you did not request this code, please ignore this email.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 30px; background-color: #f8f9fa; border-top: 1px solid #e9ecef; border-radius: 0 0 8px 8px;">
                            <p style="color: #999999; font-size: 12px; text-align: center; margin: 0;">
                                This is an automated email. Please do not reply to this message.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `
    )
}