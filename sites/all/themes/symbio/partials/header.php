<header id="header" itemscope itemtype="http://schema.org/WPHeader">
  <div class="top-info">
    <div class="row">
      <div class="small-12 large-5 columns">
        <div class="notice">
          <?php if ($page['notices']): ?>
            <p><?php print render($page['notices']); ?></p>
          <?php endif; ?>
        </div>
      </div>
      <div class="small-12 large-7 columns">
        <nav class="right-top-info-links">
        <?php
          global $user;

          if($user->uid)
          {
            // user is logged in
          }
          else
          { ?>
          <a href="<?php print $base_path; ?>user/login"><?php print t('Log in'); ?>&nbsp;<svg class="icon icon-login"><use xlink:href="#icon-login"></use></svg></a>
          <?php }
        ?>
        <?php if ($secondary_menu): ?>
          <?php print theme('links__system_secondary_menu', array('links' => $secondary_menu, 'attributes' => array('id' => 'secondary-menu-links', 'class' => array('links', 'inline', 'clearfix')), 'heading' => t('Main menu'))); ?>
        <?php endif; ?>
        </nav>
        <?php if ($page['desktop_search']): ?>
          <?php print render($page['desktop_search']); ?>
        <?php endif; ?>
      </div>
    </div>
  </div>
  <nav class="tab-bar">
    <div class="left-small">
      <a class="left-off-canvas-toggle menu-icon" aria-expanded="false"><span></span></a>
    </div>
    <div class="middle tab-bar-section">
      <a href="<?php print render($front_page); ?>" class="responsive-svg-container" title="<?php print t('Home'); ?>">
        <svg class="responsive-svg tab-bar-logo" aria-labelledby="logo" preserveAspectRatio="xMinYMin meet" viewBox="0 0 680.2 119.5"><use xlink:href="#logo"/></svg>
      </a>
    </div>
  </nav>
  <div class="row desktop-top-bar">
    <div class="column top-bar-wrapper">
      <nav class="top-bar" data-topbar itemscope itemtype="http://schema.org/SiteNavigationElement">
        <ul class="title-area">
          <li class="name">
            <h1>
              <a href="<?php print render($front_page); ?>" class="responsive-svg-container" title="<?php print t('Home'); ?>">
                <svg class="responsive-svg top-bar-logo" aria-labelledby="logo" preserveAspectRatio="xMinYMin meet" viewBox="0 0 680.2 119.5"><use xlink:href="#logo"/></svg>
              </a>
            </h1>
          </li>
        </ul>
        <div class="top-bar-section">
          <!-- Right Nav Section -->
          <?php if ($main_menu): ?>
            <div id="main-menu" class="navigation">
              <?php print theme('links__system_main_menu', array(
                'links' => $main_menu,
                'attributes' => array(
                  'id' => 'main-menu-links',
                  'class' => 'right',
                ),
              )); ?>
            </div> <!-- /#main-menu -->
          <?php endif; ?>
        </div>
      </nav>
    </div>
  </div>
  <aside class="left-off-canvas-menu" role="navigation" itemscope itemtype="http://schema.org/SiteNavigationElement">
    <ul class="off-canvas-list">
      <?php if ($page['mobile_search']): ?>
      <li class="search-input">
        <?php print render($page['mobile_search']); ?>
      </li>
      <?php endif; ?>
      <li><label><?php print t('Navigation'); ?></label></li>
      <?php if ($main_menu):
        print theme('links__system_main_menu', array(
          'links' => $main_menu,
          'attributes' => array(
            'id' => 'main-menu-links',
            'class' => 'right',
          ),
        ));
        endif; ?>
      <li><label><?php print t('More'); ?></label></li>
      <?php
        global $user;

        if($user->uid)
        {
          // user is logged in
        }
        else
        { ?>
        <li><a href="<?php print $base_path; ?>user/login"><?php print t('Log in'); ?>&nbsp;<svg class="icon icon-login"><use xlink:href="#icon-login"></use></svg></a></li>
      <?php } ?>
      <?php if ($secondary_menu): ?>
      <?php print theme('links__system_secondary_menu', array('links' => $secondary_menu, 'attributes' => array('id' => 'secondary-menu-links')));?>
      <?php endif; ?>
    </ul>
  </aside>
  <?php if(drupal_is_front_page()):?>
  <section id="banner" role="banner">
    <div class="row">
      <div class="column">
        <?php if ($page['header']): ?>
          <?php print render($page['header']); ?>
        <?php endif; ?>
        <?php if ($page['slogan']): ?>
          <h1 data-sr="enter bottom" itemprop="headline"><?php print render($page['slogan']); ?></h1>
        <?php endif; ?>
        <?php if ($page['home_page_paragraph']): ?>
          <p data-sr="enter bottom wait 0.5s" itemprop="description"><?php print render($page['home_page_paragraph']); ?></p>
        <?php endif; ?>
        <?php if ($page['home_page_bottom_header']): ?>
          <h2 data-sr="enter bottom wait 1s"><?php print render($page['home_page_bottom_header']); ?></h2>
        <?php endif; ?>
      </div>
    </div>
  </section>
  <?php endif;?>
</header>