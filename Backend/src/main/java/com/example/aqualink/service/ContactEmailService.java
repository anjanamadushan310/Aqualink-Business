package com.example.aqualink.service;

import com.example.aqualink.dto.ContactFormDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
public class ContactEmailService {

    private final JavaMailSender mailSender;
    private static final String ADMIN_EMAIL = "aqualink.demo@gmail.com";

    public void sendContactFormEmail(ContactFormDTO contactForm) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setTo(ADMIN_EMAIL);
            helper.setSubject("New Contact Form Submission - " + contactForm.getSubject());
            helper.setReplyTo(contactForm.getEmail());
            helper.setFrom("aqualink.demo@gmail.com", "AquaLink Contact Form");
            
            String htmlContent = buildContactEmailTemplate(contactForm);
            helper.setText(htmlContent, true);
            
            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send contact form email: " + e.getMessage());
        } catch (Exception e) {
            throw new RuntimeException("Failed to send contact form email: " + e.getMessage());
        }
    }
    
    private String buildContactEmailTemplate(ContactFormDTO contactForm) {
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>");
        html.append("<html lang=\"en\">");
        html.append("<head>");
        html.append("<meta charset=\"UTF-8\">");
        html.append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">");
        html.append("<title>Contact Form Submission</title>");
        html.append("</head>");
        html.append("<body style=\"margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f4f8;\">");
        html.append("<table role=\"presentation\" style=\"width: 100%; border-collapse: collapse;\">");
        html.append("<tr>");
        html.append("<td style=\"padding: 40px 20px;\">");
        html.append("<table role=\"presentation\" style=\"max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;\">");
        
        // Header
        html.append("<tr>");
        html.append("<td style=\"background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;\">");
        html.append("<h1 style=\"margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;\">🐟 New Contact Form Submission</h1>");
        html.append("</td>");
        html.append("</tr>");
        
        // Content
        html.append("<tr>");
        html.append("<td style=\"padding: 30px;\">");
        
        html.append("<div style=\"margin-bottom: 20px;\">");
        html.append("<p style=\"margin: 0 0 5px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600;\">From</p>");
        html.append("<p style=\"margin: 0; color: #1e293b; font-size: 16px; font-weight: 600;\">").append(escapeHtml(contactForm.getName())).append("</p>");
        html.append("<p style=\"margin: 5px 0 0 0; color: #3b82f6; font-size: 14px;\">").append(escapeHtml(contactForm.getEmail())).append("</p>");
        html.append("</div>");
        
        if (contactForm.getUserType() != null && !contactForm.getUserType().isEmpty()) {
            html.append("<div style=\"margin-bottom: 20px;\">");
            html.append("<p style=\"margin: 0 0 5px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600;\">User Type</p>");
            html.append("<p style=\"margin: 0; color: #1e293b; font-size: 14px;\">").append(escapeHtml(contactForm.getUserType())).append("</p>");
            html.append("</div>");
        }
        
        html.append("<div style=\"margin-bottom: 20px;\">");
        html.append("<p style=\"margin: 0 0 5px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600;\">Subject</p>");
        html.append("<p style=\"margin: 0; color: #1e293b; font-size: 16px; font-weight: 600;\">").append(escapeHtml(contactForm.getSubject())).append("</p>");
        html.append("</div>");
        
        html.append("<div style=\"margin-bottom: 20px;\">");
        html.append("<p style=\"margin: 0 0 10px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600;\">Message</p>");
        html.append("<div style=\"background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 4px;\">");
        html.append("<p style=\"margin: 0; color: #1e293b; font-size: 14px; line-height: 1.6; white-space: pre-wrap;\">").append(escapeHtml(contactForm.getMessage())).append("</p>");
        html.append("</div>");
        html.append("</div>");
        
        html.append("</td>");
        html.append("</tr>");
        
        // Footer
        html.append("<tr>");
        html.append("<td style=\"background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;\">");
        html.append("<p style=\"margin: 0; color: #64748b; font-size: 12px;\">This email was sent from the AquaLink contact form</p>");
        html.append("<p style=\"margin: 5px 0 0 0; color: #64748b; font-size: 12px;\">Reply directly to this email to respond to the sender</p>");
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
    
    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;")
                   .replace("'", "&#39;");
    }
}
