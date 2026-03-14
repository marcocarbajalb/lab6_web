package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"regexp"
	"time"
)

var chatApi = "https://chat.joelsiervas.online"

var httpClient = &http.Client{Timeout: 10 * time.Second}

func getMessages(w http.ResponseWriter, r *http.Request) {
	resp, err := httpClient.Get(chatApi + "/messages")
	if err != nil {
		log.Printf("Error al obtener mensajes: %v", err)
		http.Error(w, "Error al obtener mensajes", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", "application/json")
	io.Copy(w, resp.Body)
}

func postMessage(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	resp, err := httpClient.Post(chatApi+"/messages", "application/json", r.Body)
	if err != nil {
		log.Printf("Error al enviar mensaje: %v", err)
		http.Error(w, "Error al enviar mensaje", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", "application/json")
	io.Copy(w, resp.Body)
}

func getPreview(w http.ResponseWriter, r *http.Request) {
	url := r.URL.Query().Get("url")
	if url == "" {
		http.Error(w, "Falta el parámetro url", http.StatusBadRequest)
		return
	}

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		http.Error(w, "URL inválida", http.StatusBadRequest)
		return
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; GoChat/1.0)")

	resp, err := httpClient.Do(req)
	if err != nil {
		http.Error(w, "No se pudo obtener la página", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, "Error al leer la página", http.StatusInternalServerError)
		return
	}
	html := string(bodyBytes)

	title := extractMeta(html, "og:title")
	description := extractMeta(html, "og:description")
	if description == "" {
		description = extractMetaName(html, "description")
	}
	image := extractMeta(html, "og:image")

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"title":       title,
		"description": description,
		"image":       image,
		"url":         url,
	})
}

func extractMeta(html string, property string) string {
	re := regexp.MustCompile(`(?i)<meta[^>]+property=["']` + property + `["'][^>]+content=["']([^"']+)["']`)
	match := re.FindStringSubmatch(html)
	if len(match) > 1 {
		return match[1]
	}

	// Algunos sitios ponen content antes que property
	re2 := regexp.MustCompile(`(?i)<meta[^>]+content=["']([^"']+)["'][^>]+property=["']` + property + `["']`)
	match2 := re2.FindStringSubmatch(html)
	if len(match2) > 1 {
		return match2[1]
	}

	return ""
}

func extractMetaName(html string, name string) string {
	re := regexp.MustCompile(`(?i)<meta[^>]+name=["']` + name + `["'][^>]+content=["']([^"']+)["']`)
	match := re.FindStringSubmatch(html)
	if len(match) > 1 {
		return match[1]
	}
	re2 := regexp.MustCompile(`(?i)<meta[^>]+content=["']([^"']+)["'][^>]+name=["']` + name + `["']`)
	match2 := re2.FindStringSubmatch(html)
	if len(match2) > 1 {
		return match2[1]
	}
	return ""
}

func main() {
	http.Handle("GET /", http.FileServer(http.Dir("static")))
	http.HandleFunc("GET /api/messages", getMessages)
	http.HandleFunc("POST /api/messages", postMessage)
	http.HandleFunc("GET /api/preview", getPreview)

	fmt.Println("Server running on port 8000...")
	log.Fatal(http.ListenAndServe("0.0.0.0:8000", nil))
}