package com.example.aqualink.security.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OTPService {

    private final JavaMailSender mailSender;
    private final SecureRandom random = new SecureRandom();

    // Store OTPs temporarily in memory with timestamp
    private final Map<String, OTPData> otpStorage = new ConcurrentHashMap<>();

    @Autowired
    public OTPService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public String generateOTP(String email) {
        // Generate 6 digit OTP
        int otp = 100000 + random.nextInt(900000);
        String otpString = String.valueOf(otp);

        // Store OTP with timestamp (valid for 5 minutes)
        long expiryTime = System.currentTimeMillis() + (5 * 60 * 1000);
        otpStorage.put(email, new OTPData(otpString, expiryTime));

        return otpString;
    }

    public void sendOTPEmail(String toEmail, String otp) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setTo(toEmail);
            helper.setSubject("Your AquaLink Registration OTP Code");
            helper.setFrom("aqualink.demo@gmail.com", "AquaLink");
            
            // Professional HTML email template
            String htmlContent = buildOTPEmailTemplate(otp, toEmail);
            helper.setText(htmlContent, true); // true = HTML email
            
            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        } catch (Exception e) {
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }
    
    private String buildOTPEmailTemplate(String otp, String email) {
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>");
        html.append("<html lang=\"en\">");
        html.append("<head>");
        html.append("<meta charset=\"UTF-8\">");
        html.append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">");
        html.append("<title>AquaLink OTP Verification</title>");
        html.append("</head>");
        html.append("<body style=\"margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f4f8;\">");
        html.append("<table role=\"presentation\" style=\"width: 100%; border-collapse: collapse;\">");
        html.append("<tr>");
        html.append("<td style=\"padding: 40px 20px;\">");
        html.append("<table role=\"presentation\" style=\"max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;\">");
        
        // Header
        html.append("<tr>");
        html.append("<td style=\"background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;\">");
        html.append("<h1 style=\"margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;\">🐟 AquaLink</h1>");
        html.append("<p style=\"margin: 10px 0 0 0; color: #e0f2fe; font-size: 14px; font-weight: 400;\">Your Trusted Fish Export Partner</p>");
        html.append("</td>");
        html.append("</tr>");
        
        // Main Content
        html.append("<tr>");
        html.append("<td style=\"padding: 40px 30px;\">");
        html.append("<h2 style=\"margin: 0 0 20px 0; color: #1e293b; font-size: 24px; font-weight: 600;\">Verify Your Email Address</h2>");
        html.append("<p style=\"margin: 0 0 20px 0; color: #475569; font-size: 16px; line-height: 1.6;\">");
        html.append("Thank you for registering with <strong>AquaLink</strong>! To complete your registration, please use the One-Time Password (OTP) below:");
        html.append("</p>");
        
        // OTP Box
        html.append("<table role=\"presentation\" style=\"width: 100%; margin: 30px 0;\">");
        html.append("<tr>");
        html.append("<td style=\"text-align: center;\">");
        html.append("<div style=\"display: inline-block; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border: 2px solid #3b82f6; border-radius: 12px; padding: 25px 40px;\">");
        html.append("<p style=\"margin: 0 0 8px 0; color: #1e40af; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;\">Your OTP Code</p>");
        html.append("<p style=\"margin: 0; color: #1e40af; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;\">").append(otp).append("</p>");
        html.append("</div>");
        html.append("</td>");
        html.append("</tr>");
        html.append("</table>");
        
        // Warning Box
        html.append("<div style=\"background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 16px 20px; margin: 30px 0;\">");
        html.append("<p style=\"margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;\">");
        html.append("<strong>⏰ Important:</strong> This code will expire in <strong>5 minutes</strong> for your security.");
        html.append("</p>");
        html.append("</div>");
        
        html.append("<p style=\"margin: 20px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6;\">");
        html.append("If you didn't request this code, please ignore this email or contact our support team if you have concerns about your account security.");
        html.append("</p>");
        html.append("</td>");
        html.append("</tr>");
        
        // Footer
        html.append("<tr>");
        html.append("<td style=\"background-color: #f8fafc; padding: 30px; border-top: 1px solid #e2e8f0;\">");
        html.append("<table role=\"presentation\" style=\"width: 100%;\">");
        html.append("<tr>");
        html.append("<td style=\"text-align: center;\">");
        html.append("<p style=\"margin: 0 0 15px 0; color: #475569; font-size: 14px; font-weight: 600;\">Need Help?</p>");
        html.append("<p style=\"margin: 0 0 20px 0; color: #64748b; font-size: 13px; line-height: 1.5;\">");
        html.append("Contact us at <a href=\"mailto:aqualink.demo@gmail.com\" style=\"color: #3b82f6; text-decoration: none; font-weight: 600;\">aqualink.demo@gmail.com</a>");
        html.append("</p>");
        html.append("<div style=\"border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px;\">");
        html.append("<p style=\"margin: 0 0 8px 0; color: #94a3b8; font-size: 12px;\">© 2025 AquaLink. All rights reserved.</p>");
        html.append("</div>");
        html.append("</td>");
        html.append("</tr>");
        html.append("</table>");
        html.append("</td>");
        html.append("</tr>");
        
        html.append("</table>");
        
        // Disclaimer
        html.append("<table role=\"presentation\" style=\"max-width: 600px; margin: 20px auto 0;\">");
        html.append("<tr>");
        html.append("<td style=\"text-align: center; padding: 0 20px;\">");
        html.append("<p style=\"margin: 0; color: #94a3b8; font-size: 11px; line-height: 1.5;\">");
        html.append("This is an automated message. Please do not reply to this email.<br>");
        html.append("This email was sent to ").append(email).append(" because you requested an OTP for registration.");
        html.append("</p>");
        html.append("</td>");
        html.append("</tr>");
        html.append("</table>");
        
        html.append("</td>");
        html.append("</tr>");
        html.append("</table>");
        html.append("</body>");
        html.append("</html>");
        
        return html.toString();
    }

    public boolean verifyOTP(String email, String otp) {
        OTPData otpData = otpStorage.get(email);

        if (otpData == null) {
            return false; // No OTP found for this email
        }

        // Check if OTP is expired
        if (System.currentTimeMillis() > otpData.getExpiryTime()) {
            otpStorage.remove(email); // Remove expired OTP
            return false;
        }

        // Check if OTP matches
        if (otpData.getOtp().equals(otp)) {
            otpStorage.remove(email); // Remove OTP after successful verification
            return true;
        }

        return false;
    }

    public void clearOTP(String email) {
        otpStorage.remove(email);
    }

    // Inner class to store OTP with expiry time
    private static class OTPData {
        private final String otp;
        private final long expiryTime;

        public OTPData(String otp, long expiryTime) {
            this.otp = otp;
            this.expiryTime = expiryTime;
        }

        public String getOtp() {
            return otp;
        }

        public long getExpiryTime() {
            return expiryTime;
        }
    }
}
