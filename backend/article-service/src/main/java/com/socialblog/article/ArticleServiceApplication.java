package com.socialblog.article;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.scheduling.annotation.EnableScheduling;
import java.io.File;
import java.nio.file.Files;

@SpringBootApplication @EnableScheduling @EnableSpringDataWebSupport(pageSerializationMode=EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO)
public class ArticleServiceApplication {
    static {
        try {
            File envFile = findEnvFile(new File("."));
            if (envFile != null && envFile.exists()) {
                Files.lines(envFile.toPath())
                        .map(String::trim)
                        .filter(line -> !line.isEmpty() && !line.startsWith("#") && line.contains("="))
                        .forEach(line -> {
                            int eqIdx = line.indexOf('=');
                            String key = line.substring(0, eqIdx).trim();
                            String value = line.substring(eqIdx + 1).trim();
                            if ((value.startsWith("\"") && value.endsWith("\"")) || 
                                (value.startsWith("'") && value.endsWith("'"))) {
                                value = value.substring(1, value.length() - 1);
                            }
                            if (System.getProperty(key) == null && System.getenv(key) == null) {
                                System.setProperty(key, value);
                            }
                        });
                System.out.println("Loaded environment variables from local .env file successfully.");
            }
        } catch (Exception e) {
            System.err.println("Failed to load .env file: " + e.getMessage());
        }
    }

    private static File findEnvFile(File currentDir) {
        if (currentDir == null) return null;
        File env = new File(currentDir, ".env");
        if (env.exists() && env.isFile()) {
            return env;
        }
        File parent = currentDir.getAbsoluteFile().getParentFile();
        int attempts = 0;
        while (parent != null && attempts < 4) {
            env = new File(parent, ".env");
            if (env.exists() && env.isFile()) {
                return env;
            }
            parent = parent.getParentFile();
            attempts++;
        }
        return null;
    }

    public static void main(String[] args){SpringApplication.run(ArticleServiceApplication.class,args);}
}
