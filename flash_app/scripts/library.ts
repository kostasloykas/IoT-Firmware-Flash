/* library.ts */

import { rejects } from "assert";
import * as fs from "fs";
import { resolve } from "path";

declare global {
    interface Navigator {
        serial: any;
    }
}

// ============================= VARIABLES =============================




enum RESPOND {
    COMMAND_RET_SUCCESS = 0x40,
    COMMAND_RET_UNKNOWN_CMD = 0x41,
    COMMAND_RET_INVALID_ADR = 0x43,
    COMMAND_RET_FLASH_FAIL = 0x44
};


const ACK = 0XCC;
const NACK = 0x33;

export enum SUPPORTED_DEVICES {
    CC2538 = "CC2538"
};

type DispatcherCreateInstance = {
    [key :string]: () => CC2538;
};

// Dispatcher for creating instances auto of a specific device
export const CreateInstanceOf:DispatcherCreateInstance = {
    [SUPPORTED_DEVICES.CC2538] : () => {return new CC2538()}
}


enum FILE_EXTENTION {
    HEX = "hex"
};

enum VERSION_CC2538 {
    _512_KB,
    _256_KB,
    _128_KB
};




// ============================= FUNCTIONS =============================

export function PRINT(...anything: any): void {
    console.log(anything);
}

export function ERROR(...anything: any): void {
    throw new Error("ERROR: " + anything);
}


export function DEBUG(...anything: any): void {
    console.log("DEBUG", anything);
}


export function CheckForSerialNavigator(): void {
    // Web Serial API is not available
    if (!('serial' in navigator)) {
        alert("Web Serial API is not available")
        ERROR("Web Serial API is not available");
    }

}

// Assertions to ensure that certain conditions or
// assumptions hold true
export function assert(condition: unknown, msg: string): asserts condition {
    if (condition === false) throw new Error("Assertion: "+msg);
}



// ============================= INTERFACES =============================



interface Command {
    port:any;
    writer:any;
    reader:any;
    Encoder:any;
    Decoder:any;
    baudrate:number;



    Open(...params: any): void;
    Close(...params: any): void;
    Write(...params: any): void;
    Read(...params: any): void;
    SendAck(...params: any): void;
    SendNAck(...params: any): void;
    ReceivePacket(...params: any): void;
    SendSync(...params: any): void;
    WaitForAck(...params: any): void;
    CalculateCRC32(...params: any): void;
    Download(...params: any): void;


}




// ============================= CLASSES =============================


export class FirmwareFile {

    private firmware_bytes: Uint8Array;

    public constructor(input_element: HTMLInputElement) {

        this.CheckFileExtention(input_element.files[0].name);
        this.ConvertFirmwareToBytes(input_element)
            .then((bytes) =>{ this.firmware_bytes = bytes; DEBUG(bytes)});
    }

    // Check file extention
    private CheckFileExtention(name: string): void {
        let extention:string = name.split('.').pop().toUpperCase();
        DEBUG(name);
        if (!(extention in FILE_EXTENTION))
            ERROR("File extention is not supported");

    }

    // Convert firmware to bytes
    private ConvertFirmwareToBytes(input_element: HTMLInputElement): Promise<Uint8Array> {

        return new Promise<Uint8Array>((resolve,reject)=>{
            const reader = new FileReader();

            reader.onload = function (event) {
                PRINT("File Uploaded");
                const result = event.target?.result as ArrayBuffer;
                const bytes = new Uint8Array(result);
                resolve(bytes);
            };
    
            reader.onerror = function(event) {
                reject(new Error('Error reading file.'));
              };
    
            reader.readAsArrayBuffer(input_element.files[0]);

        });
    }
          

}




export class Packet {
    private size: number;
    private checksum: number;
    private data: Uint8Array;


    constructor(data: Uint8Array) {
        this.data = data;
        this.size = this.SizeOfPacket(data);
        this.checksum = this.ComputeChecksum(data);

    }

    public SizeOfPacket(data: Uint8Array): number {
        return 0;
    }

    public ComputeChecksum(data: Uint8Array): number {
        return 0;
    }




}





// ============================= SUPPORTED DEVICES =============================


export class CC2538 implements Command {
    private version: VERSION_CC2538;
    port:any;
    writer:any;
    reader:any;
    Encoder:any;
    Decoder:any;
    baudrate:number;
 
    // TODO: Flash firmware
    FlashFirmware(port:any,image:FirmwareFile){
        // Initialize
        this.port = port;
        this.reader = port.readable.getReader();
        this.writer = port.writable.getWriter();
        
        this.Open(port)


    }



    Open(port:any): void {
        throw new Error("Method not implemented.");
    }
    Close(...params: any): void {
        throw new Error("Method not implemented.");
    }
    Write(...params: any): void {
        throw new Error("Method not implemented.");
    }
    Read(...params: any): void {
        throw new Error("Method not implemented.");
    }
    SendAck(...params: any): void {
        throw new Error("Method not implemented.");
    }
    SendNAck(...params: any): void {
        throw new Error("Method not implemented.");
    }
    ReceivePacket(...params: any): void {
        throw new Error("Method not implemented.");
    }
    SendSync(...params: any): void {
        throw new Error("Method not implemented.");
    }
    WaitForAck(...params: any): void {
        throw new Error("Method not implemented.");
    }
    CalculateCRC32(...params: any): void {
        throw new Error("Method not implemented.");
    }
    Download(...params: any): void {
        throw new Error("Method not implemented.");
    }




}





