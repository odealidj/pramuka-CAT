package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
)

type LoginReq struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func main() {
	// Login
	loginBody, _ := json.Marshal(LoginReq{
		Username: "superadmin",
		Password: "password123", // Assuming password123 based on seed
	})
	resp, _ := http.Post("http://localhost:8080/api/v1/auth/login", "application/json", bytes.NewBuffer(loginBody))
	body, _ := ioutil.ReadAll(resp.Body)
	resp.Body.Close()
	fmt.Println("Login:", string(body))

	var loginResp map[string]interface{}
	json.Unmarshal(body, &loginResp)
	if loginResp["data"] == nil {
		fmt.Println("No token")
		return
	}
	data := loginResp["data"].(map[string]interface{})
	token := data["access_token"].(string)

	// Update Profile
	updateBody := []byte(`{"username":"superadmin","email":"superadmin@pramukacat.com","full_name":"Super Administrator"}`)
	req, _ := http.NewRequest("PUT", "http://localhost:8080/api/v1/protected/users/me", bytes.NewBuffer(updateBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{}
	resp2, _ := client.Do(req)
	body2, _ := ioutil.ReadAll(resp2.Body)
	resp2.Body.Close()
	fmt.Println("Response:", string(body2))
}
