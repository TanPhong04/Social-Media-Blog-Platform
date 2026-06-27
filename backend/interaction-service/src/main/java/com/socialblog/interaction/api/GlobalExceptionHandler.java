package com.socialblog.interaction.api;

import com.socialblog.interaction.domain.TargetType;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.Instant;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    public record ErrorResponse(Instant timestamp, int status, String code, String message, String path,
                                Map<String, String> fields) {
    }

    @ExceptionHandler(ApiException.class)
    ResponseEntity<ErrorResponse> api(ApiException e, HttpServletRequest r) {
        return ResponseEntity.status(e.status()).body(error(e.status(), e.code(), e.getMessage(), r, Map.of()));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ResponseEntity<ErrorResponse> typeMismatch(MethodArgumentTypeMismatchException e, HttpServletRequest r) {
        if (TargetType.class.equals(e.getRequiredType())) {
            return ResponseEntity.badRequest().body(error(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_TARGET_TYPE",
                    "Target type must be ARTICLE or COMMENT",
                    r,
                    Map.of(e.getName(), "must be ARTICLE or COMMENT")));
        }
        String name = e.getName();
        return ResponseEntity.badRequest().body(error(
                HttpStatus.BAD_REQUEST,
                "INVALID_REQUEST_PARAMETER",
                "Invalid request parameter: " + name,
                r,
                Map.of(name, "must be a valid " + expectedType(e))));
    }

    private ErrorResponse error(HttpStatus status, String code, String message, HttpServletRequest r, Map<String, String> fields) {
        return new ErrorResponse(Instant.now(), status.value(), code, message, r.getRequestURI(), fields);
    }

    private String expectedType(MethodArgumentTypeMismatchException e) {
        Class<?> type = e.getRequiredType();
        return type == null ? "value" : type.getSimpleName();
    }
}
