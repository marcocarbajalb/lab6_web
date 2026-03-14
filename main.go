package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
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

func main() {
	http.Handle("GET /", http.FileServer(http.Dir("static")))
	http.HandleFunc("GET /api/messages", getMessages)
	http.HandleFunc("POST /api/messages", postMessage)

	fmt.Println("Server running on port 8000...")
	log.Fatal(http.ListenAndServe("0.0.0.0:8000", nil))
}