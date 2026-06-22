package com.socialblog.article.api;
import jakarta.servlet.http.HttpServletRequest;import org.springframework.http.*;import org.springframework.web.bind.MethodArgumentNotValidException;import org.springframework.web.bind.annotation.*;import java.time.Instant;import java.util.*;
@RestControllerAdvice public class GlobalExceptionHandler{
 public record ErrorResponse(Instant timestamp,int status,String code,String message,String path,Map<String,String>fields){}
 @ExceptionHandler(ApiException.class)ResponseEntity<ErrorResponse>api(ApiException e,HttpServletRequest r){return ResponseEntity.status(e.status()).body(new ErrorResponse(Instant.now(),e.status().value(),e.code(),e.getMessage(),r.getRequestURI(),Map.of()));}
 @ExceptionHandler(MethodArgumentNotValidException.class)ResponseEntity<ErrorResponse>validation(MethodArgumentNotValidException e,HttpServletRequest r){Map<String,String>f=new LinkedHashMap<>();e.getBindingResult().getFieldErrors().forEach(x->f.putIfAbsent(x.getField(),x.getDefaultMessage()));return ResponseEntity.badRequest().body(new ErrorResponse(Instant.now(),400,"VALIDATION_FAILED","Request validation failed",r.getRequestURI(),f));}
}
