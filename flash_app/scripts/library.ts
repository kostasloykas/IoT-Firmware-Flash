/* library.ts */



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
    [key in SUPPORTED_DEVICES]: (...param:any) => CC2538;
};

// Dispatcher for creating instances auto of a specific device
export const CreateInstanceOf:DispatcherCreateInstance = {
    [SUPPORTED_DEVICES.CC2538] : (port:any) => {return new CC2538(port)}
}


enum FILE_EXTENTION {
    HEX = ".hex"
};

enum VERSION_CC2538 {
    _512_KB,
    _256_KB,
    _128_KB
};





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
    private file_extention: FILE_EXTENTION;
    private firmware_bytes: Uint8Array;




    public constructor(path: string) {
        this.path = path;
        this.file_extention = this.FindFileExtention(path);
        this.firmware_bytes = this.ConvertFirmwareToBytes(path, this.file_extention);
    }

    private FindFileExtention(path: string): FILE_EXTENTION {
        return FILE_EXTENTION.HEX;
    }

    private ConvertFirmwareToBytes(path: string, file_extention: FILE_EXTENTION): Uint8Array {
        return new Uint8Array(2);
    }


    /* compute checksum of firmware */
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

    public constructor(port:any) {
        PRINT("constructor cc2538");
        this.port = port;
        
    }
    
    // TODO: flash firmware
    Main(){

    }

    Open(...params: any): void {
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



// ============================= FUNCTIONS =============================

export function PRINT(...anything: any): void {
    console.log(anything);
}

export function ERROR(...anything: any): void {
    console.log("ERROR", anything);
}


export function DEBUG(...anything: any): void {
    console.log("DEBUG", anything);
}


export function CheckForSerialNavigator(): void {
    // Web Serial API is not available
    if (!('serial' in navigator)) {
        // class="alert alert-danger"
        alert("Web Serial API is not available")
        throw new Error("Web Serial API is not available");
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
