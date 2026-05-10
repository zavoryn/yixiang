package com.tongji.auth.verification;

import com.aliyun.dysmsapi20170525.Client;
import com.aliyun.dysmsapi20170525.models.SendSmsRequest;
import com.aliyun.teaopenapi.models.Config;
import com.tongji.storage.config.OssProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

/**
 * 生产用验证码发送器。
 * <p>
 * 邮箱 → QQ SMTP；手机号 → 阿里云短信。
 */
@Slf4j
@Component
@Primary
public class EmailCodeSender implements CodeSender {

    private final JavaMailSender mailSender;
    private final OssProperties ossProperties;

    private static final String FROM = "2908423153@qq.com";
    private static final String SMS_SIGN = "速通互联验证码";
    private static final String SMS_TEMPLATE = "100001";

    public EmailCodeSender(JavaMailSender mailSender, OssProperties ossProperties) {
        this.mailSender = mailSender;
        this.ossProperties = ossProperties;
    }

    @Override
    public void sendCode(VerificationScene scene, String identifier, String code, int expireMinutes) {
        if (isEmail(identifier)) {
            sendEmail(scene, identifier, code, expireMinutes);
        } else {
            sendSms(identifier, code);
        }
    }

    private void sendEmail(VerificationScene scene, String identifier, String code, int expireMinutes) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(FROM);
            msg.setTo(identifier);
            msg.setSubject("颐享验证码 - " + sceneLabel(scene));
            msg.setText("您的验证码是：" + code + "\n有效期 " + expireMinutes + " 分钟。\n如非本人操作请忽略。");
            mailSender.send(msg);
            log.info("Email code sent to {} for scene={}", identifier, scene);
        } catch (Exception e) {
            log.error("Failed to send email code to {}: {}", identifier, e.getMessage());
        }
    }

    private void sendSms(String phone, String code) {
        try {
            Config config = new Config()
                    .setAccessKeyId(ossProperties.getAccessKeyId())
                    .setAccessKeySecret(ossProperties.getAccessKeySecret())
                    .setEndpoint("dysmsapi.aliyuncs.com");
            Client client = new Client(config);
            SendSmsRequest req = new SendSmsRequest()
                    .setPhoneNumbers(phone)
                    .setSignName(SMS_SIGN)
                    .setTemplateCode(SMS_TEMPLATE)
                    .setTemplateParam("{\"code\":\"" + code + "\"}");
            client.sendSms(req);
            log.info("SMS code sent to {}", phone);
        } catch (Exception e) {
            log.error("Failed to send SMS code to {}: {}", phone, e.getMessage());
        }
    }

    private boolean isEmail(String identifier) {
        return identifier != null && identifier.contains("@");
    }

    private String sceneLabel(VerificationScene scene) {
        return switch (scene) {
            case REGISTER -> "注册";
            case LOGIN -> "登录";
            case RESET_PASSWORD -> "重置密码";
        };
    }
}
