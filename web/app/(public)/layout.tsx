import { NavbarProvider } from '@/components/navbar-provider';
import { Roboto } from "next/font/google";

const roboto = Roboto({
    subsets: ["latin", "vietnamese"],
    weight: ["100", "300", "400", "500", "700", "900"],
});

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={roboto.className}>
            <NavbarProvider>{children}</NavbarProvider>
        </div>
    );
}
