import React, { useState, useEffect } from "react";
import axios from "axios";
import { FileUploader } from "react-drag-drop-files";
import {
    CTable,
    CTableHead,
    CTableBody,
    CTableRow,
    CTableHeaderCell,
    CTableDataCell,
} from "@coreui/react";
import "@coreui/coreui/dist/css/coreui.min.css";

import "./appdoc.css";

function AppDoc() {
    const fileTypes = ["PDF", "JPG", "PNG"];
    const [userInfo, setUserInfo] = useState({ name: "", email: "", files: [] });
    const [selectedFile, setSelectedFile] = useState(null);
    const [encryptedContent, setEncryptedContent] = useState(null);
    const [cryptoKey, setCryptoKey] = useState(null);

    // Generate AES key and store it in the state
    useEffect(() => {
        const generateKey = async () => {
            const key = await window.crypto.subtle.generateKey(
                { name: "AES-GCM", length: 256 },
                true,
                ["encrypt", "decrypt"]
            );
            setCryptoKey(key);
        };
        generateKey();

        // Fetch user profile and uploaded files from MongoDB
        const fetchUserProfile = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get("http://localhost:5000/user/profile", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setUserInfo(response.data);
            } catch (err) {
                console.error("Error fetching user profile:", err);
            }
        };
        fetchUserProfile();
    }, []);

    const handleEncrypt = async () => {
        if (selectedFile && cryptoKey) {
            const reader = new FileReader();
            reader.onload = async () => {
                const arrayBuffer = reader.result; // File data as ArrayBuffer
                const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Random IV for AES-GCM
                try {
                    const encryptedData = await window.crypto.subtle.encrypt(
                        { name: "AES-GCM", iv },
                        cryptoKey,
                        arrayBuffer
                    );
    
                    // Combine IV and encrypted data for storage
                    const combinedBuffer = new Uint8Array(iv.byteLength + encryptedData.byteLength);
                    combinedBuffer.set(iv, 0);
                    combinedBuffer.set(new Uint8Array(encryptedData), iv.byteLength);
    
                    // Log a partial encrypted proof (Hexadecimal format, first 100 bytes)
                    const hexProof = Array.from(combinedBuffer.slice(0, 100))
                        .map((byte) => byte.toString(16).padStart(2, "0"))
                        .join("");
                    console.log("Encrypted Content (Partial Hex):", hexProof);
    
                    // Log a partial Base64 proof (first 100 bytes)
                    const base64Proof = btoa(
                        String.fromCharCode.apply(null, combinedBuffer.slice(0, 100))
                    );
                    console.log("Encrypted Content (Partial Base64):", base64Proof);
    
                    // Store the encrypted content
                    setEncryptedContent(new Blob([combinedBuffer], { type: "application/octet-stream" }));
                    console.log("Encryption successful.");
                } catch (err) {
                    console.error("Error during encryption:", err);
                }
            };
            reader.readAsArrayBuffer(selectedFile);
        } else {
            console.log("No file selected or key not ready.");
        }
    };
    

    const handleUpload = async () => {
        if (selectedFile && encryptedContent) {
            try {
                const tempFile = new File([encryptedContent], `${selectedFile.name}.enc`, {
                    type: "application/octet-stream",
                });

                const fileData = new FormData();
                fileData.append("file", tempFile);

                // Upload the file to IPFS via Pinata
                const pinataResponse = await axios({
                    method: "post",
                    url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
                    data: fileData,
                    headers: {
                        pinata_api_key: process.env.REACT_APP_PINATA_API_KEY,
                        pinata_secret_api_key: process.env.REACT_APP_PINATA_SECRET_API_KEY,
                        "Content-Type": "multipart/form-data",
                    },
                });

                const fileUrl = "https://gateway.pinata.cloud/ipfs/" + pinataResponse.data.IpfsHash;
                const fileName = selectedFile.name;

                // Save metadata in MongoDB
                const token = localStorage.getItem("token");
                await axios.post(
                    `${process.env.REACT_APP_API_BASE_URL}/file/upload`,
                    { name: fileName, link: fileUrl },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                // Update the user files state with the new file
                const newFile = { name: fileName, link: fileUrl };
                const newFileList = [...userInfo.files, newFile];
                setUserInfo({ ...userInfo, files: newFileList });

                setSelectedFile(null);
                setEncryptedContent(null);
                console.log("File uploaded successfully.");
            } catch (err) {
                console.error("Error uploading file:", err);
            }
        } else {
            console.log("No file selected or no encrypted content.");
        }
    };

    const handleDecrypt = async (fileUrl, fileName) => {
        try {
            const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
            const encryptedArrayBuffer = response.data;

            // Extract IV and encrypted data
            const iv = encryptedArrayBuffer.slice(0, 12); // First 12 bytes are the IV for AES-GCM
            const encryptedData = encryptedArrayBuffer.slice(12); // Remaining bytes are the data

            try {
                const decryptedData = await window.crypto.subtle.decrypt(
                    { name: "AES-GCM", iv: new Uint8Array(iv) },
                    cryptoKey,
                    encryptedData
                );

                const blob = new Blob([decryptedData], { type: "application/octet-stream" });
                const downloadUrl = URL.createObjectURL(blob);

                const a = document.createElement("a");
                a.href = downloadUrl;
                a.download = fileName.replace(".enc", ""); // Remove `.enc` extension
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                console.log("Decryption successful. File downloaded.");
            } catch (err) {
                console.error("Error during decryption:", err);
            }
        } catch (err) {
            console.error("Error fetching encrypted file:", err);
        }
    };

    return (
        <div className="app-doc">
            <h1>Welcome, {userInfo.name}</h1>
            <p>Email: {userInfo.email}</p>
            <h2>Your Uploaded Files</h2>
            <div className="table-container">
                <CTable striped hover>
                    <CTableHead>
                        <CTableRow>
                            <CTableHeaderCell>S.No</CTableHeaderCell>
                            <CTableHeaderCell>Name</CTableHeaderCell>
                            <CTableHeaderCell>Link</CTableHeaderCell>
                            <CTableHeaderCell>Actions</CTableHeaderCell>
                        </CTableRow>
                    </CTableHead>
                    <CTableBody>
                        {userInfo.files.map((file, index) => (
                            <CTableRow key={index}>
                                <CTableHeaderCell>{index + 1}</CTableHeaderCell>
                                <CTableDataCell>{file.name}</CTableDataCell>
                                <CTableDataCell>
                                    <a href={file.link} target="_blank" rel="noopener noreferrer">
                                        {file.link}
                                    </a>
                                </CTableDataCell>
                                <CTableDataCell>
                                    <button onClick={() => handleDecrypt(file.link, file.name)}>
                                        Decrypt
                                    </button>
                                </CTableDataCell>
                            </CTableRow>
                        ))}
                    </CTableBody>
                </CTable>
            </div>
            <h2>Upload a New File</h2>
            <div className="file-uploader">
                <FileUploader
                    multiple={false}
                    handleChange={(file) => setSelectedFile(file)}
                    name="file"
                    types={fileTypes}
                />
            </div>
            <button type="button" onClick={handleEncrypt}>
                Encrypt
            </button>
            <button type="button" onClick={handleUpload}>
                Upload
            </button>
        </div>
    );
}

export default AppDoc;
