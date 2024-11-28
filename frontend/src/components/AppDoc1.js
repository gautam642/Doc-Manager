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

import './appdoc.css'

function AppDoc() {
    const fileTypes = ["PDF", "JPG", "PNG"];
    const [userInfo, setUserInfo] = useState({ name: "", email: "", files: [] });
    const [selectedFile, setSelectedFile] = useState(null);
    const [encryptedContent, setEncryptedContent] = useState(null);

    // Fetch user profile and uploaded files on component mount
    useEffect(() => {
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

const handleEncrypt = () => {
    if (selectedFile) {
        const reader = new FileReader();
        reader.onload = () => {
            const arrayBuffer = reader.result;
            const byteArray = new Uint8Array(arrayBuffer);

            try {
                // Convert binary to Base64
                const base64Content = btoa(String.fromCharCode(...byteArray));

                // Encrypt the Base64 data
                const encrypted = CryptoJS.AES.encrypt(base64Content, AES_KEY, {
                    iv: AES_IV,
                    mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.Pkcs7,
                }).toString();

                setEncryptedContent(encrypted);
                console.log("Encrypted Content:", encrypted);
            } catch (err) {
                console.error("Error during encryption:", err);
            }
        };
        reader.readAsArrayBuffer(selectedFile); // Use ArrayBuffer for consistency
    } else {
        console.log("No file selected.");
    }
};

    

    const handleUpload = async () => {
        if (selectedFile && encryptedContent) {
            try {
                const encryptedBlob = new Blob([encryptedContent], { type: "text/plain" });
                const tempFile = new File([encryptedBlob], `${selectedFile.name}.enc`, {
                    type: "text/plain",
                });

                const fileData = new FormData();
                fileData.append("file", tempFile);

                const pinataResponse = await axios({
                    method: "post",
                    url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
                    data: fileData,
                    headers: {
                        pinata_api_key: "6022956191505df3cffa",
                        pinata_secret_api_key: "5b7cca4f723165bf53abba4022086e2cec669c70ab889824a6fbd7e2076f223d",
                        "Content-Type": "multipart/form-data",
                    },
                });

                const fileUrl = "https://gateway.pinata.cloud/ipfs/" + pinataResponse.data.IpfsHash;
                const fileName = selectedFile.name;

                const token = localStorage.getItem("token");
                const mongoResponse = await axios.post(
                    "http://localhost:5000/file/upload",
                    { name: fileName, link: fileUrl },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

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
            const response = await axios.get(fileUrl, { responseType: "text" });
            const encryptedContent = response.data;
    
            try {
                // Decrypt the content
                const decrypted = CryptoJS.AES.decrypt(encryptedContent, AES_KEY, {
                    iv: AES_IV,
                    mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.Pkcs7,
                });
    
                // Convert decrypted data from Base64 to binary
                const base64Content = CryptoJS.enc.Utf8.stringify(decrypted);
                const binaryContent = atob(base64Content);
    
                // Convert binary content to a Blob
                const byteArray = new Uint8Array(binaryContent.length);
                for (let i = 0; i < binaryContent.length; i++) {
                    byteArray[i] = binaryContent.charCodeAt(i);
                }
    
                const decryptedBlob = new Blob([byteArray], { type: "application/octet-stream" });
    
                // Trigger file download
                const downloadUrl = URL.createObjectURL(decryptedBlob);
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
                    className="ganesh"
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
