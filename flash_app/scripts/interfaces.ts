// ============================= INTERFACES =============================

export interface Command {
  port: any;
  writer: any;
  reader: any;
  encoder: any;
  decoder: any;
  filters: any;

  InvokeBootloader(...params: any): void;
  OpenPort(...params: any): void;
  ClosePort(...params: any): void;
  MemoryWrite(...params: any): void;
  MemoryRead(...params: any): void;
  SendAck(...params: any): void;
  SendNAck(...params: any): void;
  ReceivePacket(...params: any): void;
  SendSync(...params: any): void;
  WaitForAck(...params: any): void;
  CRC32(...params: any): void;
  Download(...params: any): void;
  Verify(...params: any): void;
  Run(...params: any): void;
  GetStatus(...params: any): void;
  CheckIfStatusIsSuccess(...params: any): void;
  Ping(...params: any): void;
  SendData(...params: any): void;
  Write(...params: any): void;
  Reset(...params: any): void;
  Erase(...params: any): void;
  EraseBank(...params: any): void;
  GetChipID(...params: any): void;
  SetXOSC(...params: any): void;
  SizeOfFlashMemory(...params: any): void;
  WriteFlash(...params: any): void;
  BootloaderInformations(...params: any): void;
  CheckIfImageFitsInFlashMemory(...params: any): void;
}

export interface NRF_DONGLE_Interface {
  port: any;
  writer: any;
  reader: any;
  filters: any;
  MTU: number;
  PRN: number;
  DFU_DETACH_REQUEST: number;

  OpenPort(...params: any): void;
  ClosePort(...params: any): void;
  TriggerBootloader(...params: any): void;
  ProtocolVersion(...params: any): void;
  Create(...params: any): void;
  SetReceiptNotification(...params: any): void;
  CRC(...params: any): void;
  Execute(...params: any): void;
  Select(...params: any): void;
  GetMTU(...params: any): void;
  Write(...params: any): void;
  Ping(...params: any): void;
  GetHWVersion(...params: any): void;
  GetFWVersion(...params: any): void;
  Abort(...params: any): void;
  GetResponse(...params: any): void;
  GetPacket(...params: any): void;
  TransferInitPacket(...params: any): void;
  TransferFirmware(...params: any): void;
  SendData(...params: any): void;
  WriteCommand(...params: any): void;
  GetDfuInterfaceNumber(...params: any): void;
}
