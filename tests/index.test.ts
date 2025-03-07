import { Client } from "discord.js";
import { Shoukaku } from "shoukaku";
import { Laurentina } from "../src";

const mockGuildID = '1234567890';
const mockChannelID = '0987654321';
const mockTextChannel = '1234567890'

declare module "discord.js" {
    interface Client {
        laurentina: Laurentina;
        shoukaku: Shoukaku;
    }
}

const client = {} as Client;
const mockLavalinkNodes = {} as { name: string; url: string; auth: string }[];
const mockShoukaku = {} as Shoukaku;

const laurentina = new Laurentina(mockShoukaku, mockLavalinkNodes);

client.shoukaku = mockShoukaku;
client.laurentina = laurentina;

describe("Laurentina", () => {
    it("should be a class", () => {
        expect(typeof Laurentina).toBe("function");
    });

    it("should be an instance of Laurentina", () => {
        expect(client.laurentina).toBeInstanceOf(Laurentina);
    });

    it("should have a property 'shoukaku'", () => {
        expect(client.laurentina.shoukaku).toBe(mockShoukaku);
    });

    it("should return 'false' if the guild ID for 'removeController' is not found", () => {
        expect(client.laurentina.removeController(mockGuildID)).toBeFalsy();
    });

    it("should return 'undefined' if the guild ID for 'AudioController' is not found", () => {
        const audioController = laurentina.getController(mockGuildID);
        expect(audioController).toBeUndefined();
    });
});
