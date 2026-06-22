package com.socialblog.user.api;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.*;

@RestControllerAdvice
public class GlobalExceptionHandler {
    public record ErrorResponse(Instant timestamp, int status, String code, String message, String path, Map<String,String> fields) {}
    @ExceptionHandler(ApiException.class)
    ResponseEntity<ErrorResponse> api(ApiException ex, HttpServletRequest req){return ResponseEntity.status(ex.status()).body(new ErrorResponse(Instant.now(),ex.status().value(),ex.code(),ex.getMessage(),req.getRequestURI(),Map.of()));}
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorResponse> validation(MethodArgumentNotValidException ex,HttpServletRequest req){
        Map<String,String> fields=new LinkedHashMap<>(); ex.getBindingResult().getFieldErrors().forEach(e->fields.putIfAbsent(e.getField(),e.getDefaultMessage()));
        return ResponseEntity.badRequest().body(new ErrorResponse(Instant.now(),400,"VALIDATION_FAILED","Request validation failed",req.getRequestURI(),fields));
    }
}

