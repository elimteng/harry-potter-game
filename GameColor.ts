export class GameColor {
    private r: number;
    private g: number;
    private b: number;

    // 基础颜色
    public static readonly BLACK = 0x000000;
    public static readonly WHITE = 0xFFFFFF;
    public static readonly RED = 0xFF0000;
    public static readonly GREEN = 0x00FF00;
    public static readonly BLUE = 0x0000FF;
    public static readonly YELLOW = 0xFFFF00;
    
    // 哈利波特主题颜色
    public static readonly GRYFFINDOR_RED = 0xAE0001;
    public static readonly GRYFFINDOR_GOLD = 0xD3A625;
    public static readonly SLYTHERIN_GREEN = 0x2A623D;
    public static readonly SLYTHERIN_SILVER = 0xAAAAAA;
    public static readonly RAVENCLAW_BLUE = 0x222F5B;
    public static readonly RAVENCLAW_BRONZE = 0x946B2D;
    public static readonly HUFFLEPUFF_YELLOW = 0xECB939;
    public static readonly HUFFLEPUFF_BLACK = 0x372E29;
    
    // UI颜色
    public static readonly BACKGROUND = 0x333333;
    public static readonly TEXT_PRIMARY = 0xFFFFFF;
    public static readonly TEXT_SECONDARY = 0xCCCCCC;
    public static readonly BUTTON_PRIMARY = 0x4CAF50;
    public static readonly BUTTON_HOVER = 0x66BB6A;
    public static readonly BUTTON_DISABLED = 0x78909C;

    constructor(r: number, g: number, b: number) {
        this.r = Math.max(0, Math.min(255, r));
        this.g = Math.max(0, Math.min(255, g));
        this.b = Math.max(0, Math.min(255, b));
    }

    public toHex(): number {
        return (this.r << 16) | (this.g << 8) | this.b;
    }

    public static fromHex(hex: number): GameColor {
        const r = (hex >> 16) & 0xFF;
        const g = (hex >> 8) & 0xFF;
        const b = hex & 0xFF;
        return new GameColor(r, g, b);
    }
}
