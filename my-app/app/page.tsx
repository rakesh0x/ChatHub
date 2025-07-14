"use client"

import { HtmlHTMLAttributes, useEffect, useRef, useState } from "react";
import { IoMdSend } from "react-icons/io";


export default function Home() {
  const [message, setMessage] = useState("");
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // connection with the ws server
    ws.current = new WebSocket("ws://localhost:8080");

    // listening for a ongoing connection
    ws.current.onopen = () => {
      console.log("Websocket is connected");
    }
    // received message from the server
    ws.current.onmessage = (e) => {
      console.log("Received", e.data)
    }

   // log when there is any error
   ws.current.onerror = (error) => {
      console.log("error connecting to the ws server", error);
   }
   return () => {
   ws.current?.close();
   };
  }, [])

  const handlesend = () => {
    if(message.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) return 

    ws.current.send(message)
    setMessage("");
  }

  const handlekeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if(e.key === "Enter") {
      e.preventDefault()
      handlesend()
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <div id="chat" className="flex-1 p-4 overflow-y-auto">
        ChatHub
      </div>

    

      <div id="input-box" className="p-4 border-t border-gray-300 bg-white">
        <div className="relative w-full">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            placeholder="Type your message here"
            onKeyDown={handlekeydown}
          />
          <IoMdSend
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 cursor-pointer"
            size={24}
            onClick={() => {
              console.log("Send clicked:", message);
              setMessage(""); // Clear input
            }}
          />
        </div>
      </div>

    
    </div>    
  )
}
