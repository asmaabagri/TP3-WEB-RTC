package exple1;

import java.io.IOException;
import javax.servlet.*;
import javax.servlet.http.*;

public class BlacklistFilter implements Filter {

    public void init(FilterConfig fConfig) throws ServletException {
        // Initialisation si besoin
    }

    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) 
            throws IOException, ServletException {
        
        // On regarde le paramètre "nom" envoyé par le formulaire
        String nom = request.getParameter("nom");
        
        // LISTE NOIRE : Si le nom est "hacker" ou "admin"
        if (nom != null && (nom.equalsIgnoreCase("hacker") || nom.equalsIgnoreCase("admin"))) {
            
            // On bloque et on affiche une erreur
            HttpServletResponse httpResponse = (HttpServletResponse) response;
            httpResponse.sendError(HttpServletResponse.SC_FORBIDDEN, "Accès Interdit : Ce nom est sur liste noire !");
            
        } else {
            // Sinon, on laisse passer vers la Servlet
            chain.doFilter(request, response);
        }
    }

    public void destroy() {}
}