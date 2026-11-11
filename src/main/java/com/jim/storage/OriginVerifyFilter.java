package com.jim.storage;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * In AWS, only CloudFront should be able to reach this server. The security group already limits traffic to
 * CloudFront's IP ranges, but those ranges are shared by every CloudFront customer. So CloudFront also adds a
 * secret header (X-Origin-Verify) to each request it forwards, and this filter rejects requests without it.
 *
 * The filter is OFF when app.origin-verify is empty (local development and tests). /actuator/health is always
 * allowed so the deploy script can check the container from the server itself.
 */
@Component
public class OriginVerifyFilter extends OncePerRequestFilter {

    static final String HEADER = "X-Origin-Verify";

    private final byte[] expected;

    public OriginVerifyFilter(@Value("${app.origin-verify:}") String expected) {
        this.expected = expected.getBytes(StandardCharsets.UTF_8);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return expected.length == 0 || request.getRequestURI().startsWith("/actuator/health");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String actual = request.getHeader(HEADER);
        // constant-time comparison so the secret cannot be guessed from response timing
        if (actual != null && MessageDigest.isEqual(actual.getBytes(StandardCharsets.UTF_8), expected)) {
            chain.doFilter(request, response);
        } else {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Forbidden");
        }
    }
}
