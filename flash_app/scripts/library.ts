/* library.ts */

import * as fs from "fs";

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

enum SUPPORTED_DEVICES {
    CC2538
};

type DispatcherCreateInstance = {
    [key in SUPPORTED_DEVICES]: () => CC2538;
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


// TODO: Get chip id from device and return 
// the type of device with a dummy class instance
export function GetTypeOfDevice(port:any): SUPPORTED_DEVICES {
    let type_of_device:SUPPORTED_DEVICES = null;




    assert(type_of_device !== null,"unsupported device");    
    return type_of_device;
}




// ============================= INTERFACES =============================



interface Command {

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

    private readonly path: string;
    private firmware_bytes: Uint8Array;

    public constructor(path: string) {
        assert(path.length > 0, "Path is empty");

        this.path = path;
        this.CheckFileExtention(path);
        this.ConvertFirmwareToBytes(path).then(bytes => this.firmware_bytes = bytes);
        DEBUG(this.firmware_bytes);
    }

    // Check file extention
    private CheckFileExtention(path: string): void {
        let extention:string = path.split('.').pop().toUpperCase();
        if (!(extention in FILE_EXTENTION))
            ERROR("File extention is not supported");

    }

    // TODO: Convert firmware to bytes
    private async ConvertFirmwareToBytes(path: string): Promise<Uint8Array> {
        assert(path.length > 0, "Path is empty");

        return new Promise<Uint8Array>((resolve, reject) => {
            // Use fs.readFile() method to read the file
            fs.readFile(path, 'hex', function(err:any, data:any){
                  DEBUG(err);
                  DEBUG(data);
            });
          });
    }


    /* TODO: compute checksum of firmware */
    public VerifyImage(): boolean {
        return true;
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
    private port:any;
    private writer:any;
    private reader:any;
    private Encoder:any;
    private Decoder:any;
    private baudrate:number = 9600;

 
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





