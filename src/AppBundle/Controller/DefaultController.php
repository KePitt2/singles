<?php

namespace AppBundle\Controller;

use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\ParamConverter;
use AppBundle\Entity\Single;

class DefaultController extends Controller
{
    /**
     * @Route("/", name="default_index")
     */
    public function indexAction(Request $request)
    {
        return $this->render('@templates/default/index.html.twig');
    }

    /**
     * @Route("/singles", name="default_list")
     */
    public function listAction(Request $request)
    {
        if (!$request->get('ver')) {
            throw $this->createNotFoundException('Ahhh un listillo....');
        }

        $em = $this->getDoctrine()->getRepository('AppBundle:Single');

        return $this->render('default/singles.html.twig', [
            'girls' => $em->findBy(['gender' => false], ['clicks' => 'desc'], $request->get('limit', 3)),
            'boys' => $em->findBy(['gender' => true], ['clicks' => 'desc'], $request->get('limit', 3))
        ]);
    }
    
    /**
     * @Route("/singles/{single}", name="default_scan")
     * @ParamConverter("single", class="AppBundle:Single")
     */
    public function scanAction(Request $request, Single $single)
    {
        $single->setClicks($single->getClicks() + $request->get('add', 1));
        
        $this->getDoctrine()->getManager()->flush();
        
        return $this->redirectToRoute('default_view', [
            'single' => $single->getId()
        ]);
    }
    
    /**
     * @Route("/singles/{single}/ver", name="default_view")
     * @ParamConverter("single", class="AppBundle:Single")
     */
    public function viewAction(Request $request, Single $single)
    {
        return $this->render('default/view.html.twig', [
            'single' => $single
        ]);
    }
}
