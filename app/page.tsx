export default function Home() {
    return (
        <div
            className="grid place-content-center h-screen"
        >
            <div
                className="absolute top-5 left-[50%] text-center"
                style={{
                    transform: "translateX(-50%)"
                }}
            >
                <div>
                    proiect finanțat prin programul ...
                </div>

                <div>
                    Pentru informații detaliate despre celelalte programe cofinanțate de Uniunea Europeană, vă invităm să vizitați&nbsp;
                    <a
                        href="https://www.mfe.gov.ro"
                        target="_blank"
                    >
                        www.mfe.gov.ro
                    </a>
                </div>
            </div>

            <div
                className="absolute top-5 right-5"
            >
                english
            </div>

            <h1
                className="text-4xl"
            >
                atemporal film
            </h1>
        </div>
    );
}
