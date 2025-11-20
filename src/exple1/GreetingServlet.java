package exple1;

import java.io.*;
import java.sql.*; // Indispensable pour JDBC
import javax.servlet.*;
import javax.servlet.http.*;

public class GreetingServlet extends HttpServlet {

    @Override
    public void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        // --- 1. LOGIQUE MÉTIER ---
        String votreNom = request.getParameter("nom");
        String nomPrenom = "Anonymous";

        // Gestion de la valeur par défaut si le nom est vide
        if (votreNom != null && !votreNom.isEmpty()) {
            nomPrenom = votreNom.toUpperCase();
        }

        // Calcul du gain aléatoire
        double gain = Math.random() * 10;


        // --- 2. PERSISTANCE (PostgreSQL) ---
        Connection conn = null;
        PreparedStatement ps = null;

        try {
            // A. Charger le driver PostgreSQL
            Class.forName("org.postgresql.Driver");

            // B. Se connecter à la base de données
            // Remplacez 'postgres' et 'votre_mot_de_passe' par vos vrais identifiants
            String dbUser = "postgres"; 

	         // 2. Use the password you set in the Docker command
	         String dbPassword = "root"; 
	
	         // 3. URL remains localhost because of the -p 5432:5432 flag
	         String url = "jdbc:postgresql://localhost:5432/loterie_db"; 

            conn = DriverManager.getConnection(url, dbUser, dbPassword);

            // C. Préparer la requête SQL
            // Note : "historique" est la table, "nom_joueur" et "montant_gain" sont les colonnes
            String sql = "INSERT INTO historique (nom_joueur, montant_gain) VALUES (?, ?)";
            ps = conn.prepareStatement(sql);

            // D. Remplir les paramètres (?)
            ps.setString(1, nomPrenom);
            ps.setDouble(2, gain);

            // E. Exécuter l'insertion
            ps.executeUpdate();
            System.out.println("Succès : Données enregistrées dans PostgreSQL pour " + nomPrenom);

        } catch (ClassNotFoundException e) {
            e.printStackTrace();
            System.err.println("Erreur : Driver PostgreSQL introuvable dans WEB-INF/lib");
        } catch (SQLException e) {
            e.printStackTrace();
            System.err.println("Erreur SQL : Vérifiez l'URL, le user/password ou si la table existe.");
        } finally {
            // F. Fermeture propre des ressources
            try { if (ps != null) ps.close(); } catch (SQLException e) {}
            try { if (conn != null) conn.close(); } catch (SQLException e) {}
        }


        // --- 3. PRÉSENTATION (Vers la JSP) ---
        // On envoie les données à la JSP (Attention aux noms des clés !)
        request.setAttribute("nomUtilisateur", nomPrenom);
        request.setAttribute("montantGain", gain);

        // Redirection vers la page d'affichage
        this.getServletContext()
            .getRequestDispatcher("/result.jsp")
            .forward(request, response);
    }

    public void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        doGet(request, response);
    }
}