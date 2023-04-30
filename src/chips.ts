/* chips.ts */



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


enum FILE_EXTENTION {
    IHEX = ".ihex",
    HEX = ".hex",
    RAW_BINARY = ".bin"
};

enum VERSION_CC2358 {
    _512_KB,
    _256_KB,
    _128_KB
};



// ============================= FUNCTIONS =============================

export function print(...anything: any): void {
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


export class CC2358 implements Command {
    private version: VERSION_CC2358;

    public constructor() {
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



