package com.socialblog.article.api;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.Instant;
import java.util.*;

@RestControllerAdvice
public class GlobalExceptionHandler {
    public record ErrorResponse(Instant timestamp, int status, String code, String message, String path,
                                Map<String, String> fields) {
    }

    @ExceptionHandler(ApiException.class)
    ResponseEntity<ErrorResponse> api(ApiException e, HttpServletRequest r) {
        return ResponseEntity.status(e.status()).body(error(e.status(), e.code(), e.getMessage(), r, Map.of()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorResponse> validation(MethodArgumentNotValidException e, HttpServletRequest r) {
        Map<String, String> f = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors().forEach(x -> f.putIfAbsent(x.getField(), x.getDefaultMessage()));
        return ResponseEntity.badRequest().body(error(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "Request validation failed", r, f));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ResponseEntity<ErrorResponse> typeMismatch(MethodArgumentTypeMismatchException e, HttpServletRequest r) {
        String name = e.getName();
        return ResponseEntity.badRequest().body(error(
                HttpStatus.BAD_REQUEST,
                "INVALID_REQUEST_PARAMETER",
                "Invalid request parameter: " + name,
                r,
                Map.of(name, "must be a valid " + expectedType(e))));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ErrorResponse> malformedJson(HttpMessageNotReadableException e, HttpServletRequest r) {
        return ResponseEntity.badRequest().body(error(HttpStatus.BAD_REQUEST, "MALFORMED_JSON", "Request body is malformed", r, Map.of()));
    }

    private ErrorResponse error(HttpStatus status, String code, String message, HttpServletRequest r, Map<String, String> fields) {
        return new ErrorResponse(Instant.now(), status.value(), code, message, r.getRequestURI(), fields);
    }

    private String expectedType(MethodArgumentTypeMismatchException e) {
        Class<?> type = e.getRequiredType();
        return type == null ? "value" : type.getSimpleName();
    }
}
