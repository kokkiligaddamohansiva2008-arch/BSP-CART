package com.bspcart.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
public class UploadController {

    private static final Set<String> ALLOWED = Set.of("jpg", "jpeg", "png", "gif", "webp");

    private final Path dir;

    public UploadController(@Value("${upload.path}") String uploadPath) throws IOException {
        this.dir = Paths.get(uploadPath).toAbsolutePath().normalize();
        Files.createDirectories(dir);
    }

    /** POST multipart/form-data, field name "files" (one or many). Returns {"urls": [...]}. */
    @PostMapping("/api/seller/upload")
    public Map<String, List<String>> upload(@RequestParam("files") List<MultipartFile> files) throws IOException {
        List<String> urls = new ArrayList<>();
        for (MultipartFile f : files) {
            if (f.isEmpty()) continue;
            String ext = StringUtils.getFilenameExtension(f.getOriginalFilename());
            ext = ext == null ? "" : ext.toLowerCase();
            String type = f.getContentType();
            if (!ALLOWED.contains(ext) || type == null || !type.startsWith("image/")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Only jpg, png, gif or webp images are allowed");
            }
            String name = UUID.randomUUID() + "." + ext;
            f.transferTo(dir.resolve(name));
            urls.add(ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/uploads/").path(name).toUriString());
        }
        return Map.of("urls", urls);
    }
}
