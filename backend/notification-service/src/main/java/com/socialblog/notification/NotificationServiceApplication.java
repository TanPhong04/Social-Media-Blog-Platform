package com.socialblog.notification;import org.springframework.boot.SpringApplication;import org.springframework.boot.autoconfigure.SpringBootApplication;import org.springframework.data.web.config.EnableSpringDataWebSupport;

@SpringBootApplication @EnableSpringDataWebSupport(pageSerializationMode=EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO)
public class NotificationServiceApplication {
    static {
        try {
            java.io.File f = new java.io.File(".");
            for (int i = 0; i < 4 && f != null; i++) {
                java.io.File env = new java.io.File(f, ".env");
                if (env.exists()) {
                    java.nio.file.Files.lines(env.toPath())
                        .map(String::trim)
                        .filter(l -> !l.isEmpty() && !l.startsWith("#") && l.contains("="))
                        .forEach(l -> {
                            String k = l.substring(0, l.indexOf('=')).trim();
                            String v = l.substring(l.indexOf('=') + 1).trim();
                            if ((v.startsWith("\"") && v.endsWith("\"")) || (v.startsWith("'") && v.endsWith("'"))) v = v.substring(1, v.length() - 1);
                            if (System.getProperty(k) == null && System.getenv(k) == null) System.setProperty(k, v);
                        });
                    System.out.println("Loaded .env successfully.");
                    break;
                }
                f = f.getAbsoluteFile().getParentFile();
            }
        } catch (Exception e) {}
    }

    public static void main(String[] a) {
        SpringApplication.run(NotificationServiceApplication.class, a);
    }
}
