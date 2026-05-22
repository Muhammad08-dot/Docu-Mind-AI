"""
DocuMind AI - WebSocket API for Real-time Updates
"""
import asyncio
import json
from typing import Dict, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import structlog

logger = structlog.get_logger()

router = APIRouter(tags=["WebSocket"])


class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""
    
    def __init__(self):
        # Map of user_id -> set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Broadcast connections (for global events)
        self.broadcast_connections: Set[WebSocket] = set()
    
    async def connect(self, websocket: WebSocket, user_id: str = None):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        
        if user_id:
            if user_id not in self.active_connections:
                self.active_connections[user_id] = set()
            self.active_connections[user_id].add(websocket)
        else:
            self.broadcast_connections.add(websocket)
        
        logger.info("WebSocket connected", user_id=user_id)
    
    def disconnect(self, websocket: WebSocket, user_id: str = None):
        """Remove a WebSocket connection"""
        if user_id and user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        else:
            self.broadcast_connections.discard(websocket)
        
        logger.info("WebSocket disconnected", user_id=user_id)
    
    async def send_to_user(self, user_id: str, message: dict):
        """Send a message to a specific user"""
        if user_id in self.active_connections:
            dead_connections = set()
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    dead_connections.add(connection)
            
            # Clean up dead connections
            self.active_connections[user_id] -= dead_connections
    
    async def broadcast(self, message: dict):
        """Broadcast a message to all connected clients"""
        dead_connections = set()
        
        for connection in self.broadcast_connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead_connections.add(connection)
        
        # Also send to all user-specific connections
        for user_id in self.active_connections:
            await self.send_to_user(user_id, message)
        
        # Clean up dead broadcast connections
        self.broadcast_connections -= dead_connections


manager = ConnectionManager()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    General WebSocket endpoint for real-time updates
    
    Message Types:
    - document_processing: Updates on document processing status
    - query_complete: Notification when a query is done
    - system_stats: Periodic system statistics
    """
    await manager.connect(websocket)
    
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                msg_type = message.get("type")
                
                if msg_type == "ping":
                    await websocket.send_json({"type": "pong"})
                elif msg_type == "subscribe":
                    # Handle subscription to specific events
                    event_type = message.get("event")
                    logger.info("Client subscribed to event", event=event_type)
                    await websocket.send_json({
                        "type": "subscribed",
                        "event": event_type
                    })
                
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON"
                })
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@router.websocket("/ws/user/{user_id}")
async def user_websocket_endpoint(websocket: WebSocket, user_id: str):
    """
    User-specific WebSocket for personalized updates
    """
    await manager.connect(websocket, user_id)
    
    try:
        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "message": f"Connected as user: {user_id}"
        })
        
        while True:
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                msg_type = message.get("type")
                
                if msg_type == "ping":
                    await websocket.send_json({"type": "pong"})
                
            except json.JSONDecodeError:
                pass
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)


# Helper functions for sending real-time updates

async def notify_document_processing(user_id: str, doc_id: str, status: str, progress: int = 0):
    """Send document processing update to user"""
    await manager.send_to_user(user_id, {
        "type": "document_processing",
        "doc_id": doc_id,
        "status": status,
        "progress": progress
    })


async def notify_document_complete(user_id: str, doc_id: str, filename: str, chunks: int):
    """Notify user when document processing is complete"""
    await manager.send_to_user(user_id, {
        "type": "document_complete",
        "doc_id": doc_id,
        "filename": filename,
        "chunks": chunks,
        "message": f"Document '{filename}' has been processed with {chunks} chunks"
    })


async def notify_query_streaming(user_id: str, session_id: str, chunk: str, is_final: bool = False):
    """Stream query response to user in real-time"""
    await manager.send_to_user(user_id, {
        "type": "query_streaming",
        "session_id": session_id,
        "chunk": chunk,
        "is_final": is_final
    })


async def broadcast_system_stats(stats: dict):
    """Broadcast system statistics to all connected clients"""
    await manager.broadcast({
        "type": "system_stats",
        "stats": stats
    })
