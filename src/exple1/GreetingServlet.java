package exple1;
import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;
import javax.servlet.annotation.WebServlet;


public class GreetingServlet extends HttpServlet {

    @Override
    public void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        response.setContentType("text/html");
        PrintWriter out = response.getWriter();
        
        String docType = "<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.0 Transitional//EN\">\n";
        String title = null;
        String votreNom = null;
        String nomPrenom = "Anonymous";
        
        votreNom = request.getParameter("nom");
        if (votreNom != null)
            nomPrenom = votreNom.toUpperCase();
        
        title = "<H1>Greetings " + nomPrenom + "!</H1>\n";
        
        out.println(docType +
                "<HTML>\n" +
                "<HEAD><TITLE>Greetings Servlet</TITLE></HEAD>\n" +
                "<BODY BGCOLOR=\"#FDF5E6\">\n" +
                title +
                "</BODY></HTML>");
        
        out.println("Vous avez gagne: " + Math.random() * 10);
        out.println(" millions de dollars!");
    }

    public void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        doGet(request, response);
    }
}