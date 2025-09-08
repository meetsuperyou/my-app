/**
import { IWebSocket } from './websocket.interface';
import { Capacitor } from '@capacitor/core';
import { WebSocketPlugin } from 'capacitor-websocket-plugin'; // 假設的 plugin

export class CapacitorWebSocket implements IWebSocket {
  private socketId?: string;

  onOpen?: (event: any) => void;
  onMessage?: (event: { data: any }) => void;
  onClose?: (event: any) => void;
  onError?: (event: any) => void;

  async connect(url: string): Promise<void> {
    const { socketId } = await WebSocketPlugin.connect({ url });
    this.socketId = socketId;

    WebSocketPlugin.addListener('onOpen', (event) => this.onOpen?.(event));
    WebSocketPlugin.addListener('onMessage', (event) => this.onMessage?.({ data: event.data }));
    WebSocketPlugin.addListener('onClose', (event) => this.onClose?.(event));
    WebSocketPlugin.addListener('onError', (event) => this.onError?.(event));
  }

  async send(data: string): Promise<void> {
    if (!this.socketId) return;
    await WebSocketPlugin.send({ socketId: this.socketId, data });
  }

  async close(): Promise<void> {
    if (!this.socketId) return;
    await WebSocketPlugin.close({ socketId: this.socketId });
  }
}
**/
