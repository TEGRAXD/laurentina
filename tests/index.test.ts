import { Client, TextChannel } from "discord.js";
import { Player, Shoukaku } from "shoukaku";
import { Laurentina } from "../src";

// Mocks
// const mockGuildID = '1234567890';
// const mockChannelID = '0987654321';
// const mockTextChannel = {} as TextChannel;
// const mockPlayer = {} as Player;

interface CustomClient extends Client {
    shoukaku: Shoukaku;
    laurentina: Laurentina;
}

const client = {} as CustomClient;
const mockShoukaku = {} as Shoukaku;
const mockLavalinkNodes = {} as { name: string; url: string; auth: string }[];

const laurentina = new Laurentina(client, mockShoukaku, mockLavalinkNodes);

client.shoukaku = mockShoukaku;
client.laurentina = laurentina;

describe("Laurentina", () => {
    it("should be a class", () => {
        expect(typeof Laurentina).toBe("function");
    });

    it("should be an instance of Laurentina", () => {
        expect(laurentina).toBeInstanceOf(Laurentina);
    });

    it("should have a property 'client'", () => {
        expect(laurentina.client).toBe(client);
    });

    it("should have a property 'shoukaku'", () => {
        expect(laurentina.shoukaku).toBe(mockShoukaku);
    });
});
