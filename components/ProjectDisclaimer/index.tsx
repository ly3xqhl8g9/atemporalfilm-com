export default function ProjectDisclaimer() {
    return (
        <>
            <p>
                Pentru informații detaliate despre celelalte programe cofinanțate de Uniunea Europeană, vă invităm să vizitați
                &nbsp;
                <a
                    href="https://www.mfe.gov.ro"
                    target="_blank"
                >
                    www.mfe.gov.ro
                </a>
            </p>

            <div
                className="flex gap-4 items-center justify-end text-right"
            >
                <div>
                    <a
                        href="https://www.regionordest.ro"
                        target="_blank"
                    >
                        www.regionordest.ro
                    </a>

                    <br />

                    <a
                        href="https://www.facebook.com/RegioNordEst.ro"
                        target="_blank"
                    >
                        www.facebook.com/RegioNordEst.ro
                    </a>
                </div>

                <div
                    className="my-4"
                >
                    <div
                        style={{
                            fontSize: '1.2rem',
                            fontStyle: 'italic',
                            fontWeight: 'bold',
                            backgroundColor: '#fcc300',
                            color: 'white',
                            padding: '1rem',
                            borderTopRightRadius: '2rem',
                            borderBottomRightRadius: '2rem',
                            height: '60px',
                            width: '170px',
                            userSelect: 'none',
                        }}
                    >
                        Aproape de tine
                    </div>
                </div>
            </div>
        </>
    );
}
